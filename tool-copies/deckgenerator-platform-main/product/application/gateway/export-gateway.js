// =============================================================================
// Export Gateway — Mounting Stage (Milestone M10, WP4). Application Layer,
// per ADR-0009's layering clarification: "orchestrates export, obtains a
// deck definition, coordinates rendering, may call the Domain Layer exactly
// as already permitted by the existing dependency table, contains no
// rendering or export logic."
//
// This file owns the in-process, workspace-scoped queue Technical Blueprint
// §09 specifies for Export Jobs at "Local App tier" — an in-memory array
// plus a single worker loop, not a distributed queue service. It consumes
// ExportService (Domain) and the Export Runtime (WP3) exactly as the
// approved execution plan scopes WP4 to; it never touches ExportRepository
// directly, never defines a route, and never touches UI code.
//
// Two capabilities described by the governing documents could NOT be built
// here without a change to an earlier, already-approved milestone. Both are
// reported in full in the WP4 completion report rather than worked around:
//   1. True crash-recovery (a Job surviving a full process restart) needs a
//      repository-level way to find Running Jobs — ExportRepository (WP1)
//      exposes no such method.
//   2. Resolving a cancellation of a Job that is still Queued (never
//      entered Running) needs ExportService.markFailed to forward
//      {cancelled: true} to the repository — it does not (identified at
//      WP2 sign-off, not yet patched).
// Cancellation of a Job that IS Running is fully implemented below via the
// ordinary, already-valid Running -> Failed transition — no gap there.
// =============================================================================
import { exportService } from "../../domain/export-service.js";
import { presentationService } from "../../domain/presentation-service.js";
import { renderExport } from "../../export-runtime/index.mjs";

const MAX_ATTEMPTS = 2; // 1 initial attempt + 1 automatic retry — Technical Blueprint §09

const queue = []; // [{ context, jobId }] — context captured at enqueue time,
                   // since the worker itself has no per-request session of
                   // its own to derive one from.
let processing = false;

// jobIds with a pending cancellation, checked between slides. Deliberately
// NOT a new Job status (approved M10 constraint: no new states) — it is
// purely in-process bookkeeping for this one worker.
const cancelRequested = new Set();

/**
 * Adds a Queued Job to the in-process queue and starts the worker loop if
 * it isn't already running. `context` is the authorization context of the
 * request that created the Job (already checked once, at requestExport()
 * time) — captured here so the worker can later call
 * presentationService.buildDeckDefinition(), which requires one, without
 * needing a second, independent authorization mechanism.
 */
export function enqueue(context, jobId) {
  queue.push({ context, jobId });
  if (!processing) processQueue();
}

async function processQueue() {
  processing = true;
  while (queue.length) {
    const { context, jobId } = queue.shift();
    try {
      await processJob(context, jobId);
    } catch (e) {
      // A defect in orchestration itself (not a rendering failure, which
      // processJob already turns into a Failed Job) must not silently kill
      // the worker loop for every Job queued after it.
      console.error(`[export-gateway] Job ${jobId} orchestration error:`, e);
    }
  }
  processing = false;
}

async function processJob(context, jobId) {
  const job = await exportService.getExportJob(context, jobId);
  // Cancelled while still queued — the queue entry may outlive the
  // cancellation (cancel() resolves the Job itself), so skip it here rather
  // than attempting an invalid Failed -> Running transition.
  if (job.status !== "Queued") {
    cancelRequested.delete(jobId);
    return;
  }
  const deckDefinition = await presentationService.buildDeckDefinition(context, job.presentationId);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await exportService.markRunning(jobId);

    let cancelledDuringRun = false;
    const onSlideProgress = (slidesComplete, slidesTotal) => {
      exportService.reportProgress(jobId, { slidesComplete, slidesTotal }).catch(() => {
        // Progress reporting is advisory only (Technical Blueprint §12) —
        // a failed progress write must never abort the export itself.
      });
      if (cancelRequested.has(jobId)) {
        cancelledDuringRun = true;
        // Thrown synchronously inside renderExport()'s per-slide loop
        // (index.mjs: `if (onSlideProgress) onSlideProgress(...)`, plain,
        // unguarded, unmodified) — propagates to renderExport()'s own
        // try/catch, which returns { error }, ending the run after the
        // current slide, never mid-slide. No change to WP3 required.
        throw new Error("__EXPORT_CANCELLED__");
      }
    };

    const result = await renderExport(deckDefinition, job.format, onSlideProgress);

    if (!result.error) {
      await exportService.markSucceeded(jobId, {
        presentationId: job.presentationId,
        format: job.format,
        storageRef: result.filePath,
        contentHash: result.contentHash,
      });
      cancelRequested.delete(jobId);
      return;
    }

    await exportService.markFailed(jobId, cancelledDuringRun ? "Cancelled by user" : result.error);

    if (cancelledDuringRun) {
      cancelRequested.delete(jobId);
      return; // a user cancellation is never auto-retried
    }
    if (attempt < MAX_ATTEMPTS) {
      await exportService.requeue(jobId); // Failed -> Queued, the one automatic retry
      continue;
    }
    // final failure after the automatic retry — Job stays Failed
    cancelRequested.delete(jobId);
  }
}

/**
 * Honors a cancellation request for a Job already validated as cancelable
 * by ExportService.validateCancelable (Queued or Running).
 *
 * Running: flags the job so the in-flight render stops after its current
 * slide, then resolves via the ordinary, already-valid Running -> Failed
 * transition — no {cancelled} marker needed for this path.
 *
 * Queued: resolves immediately (no worker ever claimed it) via the now-
 * forwarded ExportService.markFailed(jobId, error, { cancelled: true }) —
 * the WP4 Corrections fix for the gap identified at WP2 sign-off. Still
 * goes through ExportService, never the Repository directly.
 */
export async function cancel(context, jobId) {
  const job = await exportService.validateCancelable(context, jobId);

  if (job.status === "Running") {
    cancelRequested.add(jobId);
    return { accepted: true };
  }

  // job.status === "Queued" — resolve the Job AND drop the queue entry so
  // the worker never tries a Failed -> Running transition on it later.
  const qi = queue.findIndex((entry) => entry.jobId === jobId);
  if (qi !== -1) queue.splice(qi, 1);
  await exportService.markFailed(jobId, "Cancelled by user", { cancelled: true });
  return { accepted: true };
}

// ---- crash-recovery sweep (WP4 Corrections, Finding 2) --------------------

const RECOVERY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes — implementation freedom (timeout value)
let sweepHandle = null;

/**
 * Technical Blueprint §09 Recovery: "A crashed worker's in-flight Job is
 * requeued via a heartbeat/timeout sweep." Reads persisted state via
 * ExportService.findRunningJobs() — never this process's own in-memory
 * queue, which a crash would have destroyed along with everything else —
 * so a Job left Running by a worker that has since died is found and
 * resolved even though nothing in memory remembers it existed.
 *
 * Deliberately does NOT re-enqueue and reprocess the recovered Job. Doing
 * so would need to re-derive a workspace-scoped context to call
 * presentationService.buildDeckDefinition() again, and no such context
 * survives a crash, nor does any context-free path to reconstruct one
 * exist (presentation-service.js's own header: "There is no longer any
 * fallback workspace anywhere in this file" — a deliberate M4 removal).
 * This sweep's own responsibility ends at requeuing: Running -> Queued
 * (already valid, no gap) via the same ExportService.requeue() manual/
 * automatic retry already uses — the same Job id, never a new one. A
 * requeued Job is then only picked up again by a fresh, explicitly-
 * authorized request (enqueue(context, jobId)), which does carry a real
 * context. See the WP4 Corrections report for the full finding.
 *
 * @param {number} [timeoutMs] - implementation freedom (timeout value).
 * @returns {Promise<string[]>} ids of Jobs requeued by this pass.
 */
export async function runRecoverySweep(timeoutMs = RECOVERY_TIMEOUT_MS) {
  const running = await exportService.findRunningJobs();
  const now = Date.now();
  const recovered = [];
  for (const job of running) {
    if (now - new Date(job.updatedAt).getTime() > timeoutMs) {
      // Resolve as Failed, never Running -> Queued: a requeued Job would sit
      // Queued forever (no worker re-enqueues it after a crash) and its
      // presence would 409-block every new export of the same presentation
      // and format. Failed is terminal, retryable by the user, and honest.
      await exportService.markFailed(job.id, "Export was interrupted — try again.");
      recovered.push(job.id);
    }
  }
  return recovered;
}

/** Wires runRecoverySweep() to a real interval — implementation freedom
 * (interval timing). Not called anywhere yet: actually starting it as part
 * of server boot is server.js's concern, outside this correction's scope
 * (touching server.js was not one of the two required corrections). */
export function startRecoverySweep(intervalMs = 60 * 1000) {
  stopRecoverySweep();
  sweepHandle = setInterval(() => { runRecoverySweep().catch((e) => console.error("[export-gateway] recovery sweep error:", e)); }, intervalMs);
  return sweepHandle;
}

export function stopRecoverySweep() {
  if (sweepHandle) { clearInterval(sweepHandle); sweepHandle = null; }
}
