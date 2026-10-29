// =============================================================================
// Export Service — Milestone M10, Domain Layer (Technical Blueprint §04).
//
// Public methods: requestExport, getExportJob, getLatestExport — exactly the
// three the Technical Blueprint names for this Service, plus the internal
// status-transition helpers and cancellation validation the approved
// execution plan scopes to WP2.
//
// Neither Export Job nor Export carries its own workspaceId (approved M10
// implementation decision, Step 1.5 Finding 6). Every method below enforces
// workspace visibility by loading the referenced Presentation through the
// existing Presentation Service — reusing its own assertVisible check —
// rather than inventing a second, redundant scoping mechanism here.
//
// requestExport creates a Queued Export Job only. It never invokes the
// Export Runtime, never invokes the Mounting Stage, and performs no export
// work itself — driving execution is the Application Layer route's own
// responsibility (approved M10 Decision 4: "requestExport() creates and
// persists the Job only; it never invokes the Mounting Stage"). This keeps
// the Domain Layer from ever reaching up into the Application Layer, per
// the dependency table ADR-0009 relies on.
//
// This file depends only on the Export Repository (WP1) and the existing
// Presentation Service — no route, UI, browser API, Export Runtime, or
// queue implementation is referenced anywhere below.
// =============================================================================
import { exportRepository, ExportFileNotFoundError } from "../storage/export-repository.js";
import { presentationService, PresentationNotFoundError } from "./presentation-service.js";

export class ExportJobNotFoundError extends Error {
  constructor(id) {
    super(`Export Job ${id} not found.`);
    this.name = "ExportJobNotFoundError";
  }
}

/** Download support (WP6 finding resolution): distinct from
 * ExportJobNotFoundError — this covers a missing/inaccessible Export
 * *record* (the completed artifact), not a missing Export *Job*. Also
 * thrown when the Repository's ExportFileNotFoundError surfaces (the
 * record exists but its file is gone) — the Route layer cannot
 * distinguish "no such Export" from "Export's file evaporated" without
 * disclosing storage internals, and per this codebase's established
 * cross-tenant posture (assertJobVisible below, requireOwnerOrRole in the
 * Authorization middleware) a missing resource is reported not-found, not
 * with a different status that would leak which case applies. */
export class ExportNotFoundError extends Error {
  constructor(id) {
    super(`Export ${id} not found.`);
    this.name = "ExportNotFoundError";
  }
}

export class ExportNotCancelableError extends Error {
  constructor(id, status) {
    super(`Export Job ${id} cannot be cancelled from status "${status}".`);
    this.name = "ExportNotCancelableError";
    this.id = id;
    this.status = status;
  }
}

/** WP5: server-side duplicate-active-Job enforcement. */
/** Nothing to export. Thrown rather than producing an empty file that reports
 *  success. */
export class EmptyPresentationError extends Error {
  constructor(presentationId) {
    super("This presentation has no slides yet, so there is nothing to export.");
    this.name = "EmptyPresentationError";
    this.presentationId = presentationId;
  }
}

export class DuplicateExportJobError extends Error {
  constructor(presentationId, format, existingJobId) {
    super(`An export is already in progress for this presentation (${format}).`);
    this.name = "DuplicateExportJobError";
    this.presentationId = presentationId;
    this.format = format;
    this.existingJobId = existingJobId;
  }
}

/**
 * Workspace isolation for a loaded Export Job. Neither Export Job nor
 * Export has its own workspaceId — visibility is checked by loading the
 * Job's referenced Presentation, exactly as every other cross-entity lookup
 * in this codebase already does. A Job whose Presentation isn't visible is
 * reported not-found, not forbidden — the same tenant-isolation posture
 * assertVisible() already establishes for Presentation itself.
 */
async function assertJobVisible(context, job, jobId) {
  if (!job) throw new ExportJobNotFoundError(jobId);
  try {
    await presentationService.getPresentation(context, job.presentationId);
  } catch (e) {
    if (e instanceof PresentationNotFoundError) throw new ExportJobNotFoundError(jobId);
    throw e;
  }
  return job;
}

/** Download support (WP6 finding resolution): the Export-record analogue
 * of assertJobVisible above — same pattern, same reasoning, applied to an
 * Export record instead of an Export Job. */
async function assertExportVisible(context, exported, id) {
  if (!exported) throw new ExportNotFoundError(id);
  try {
    await presentationService.getPresentation(context, exported.presentationId);
  } catch (e) {
    if (e instanceof PresentationNotFoundError) throw new ExportNotFoundError(id);
    throw e;
  }
  return exported;
}

class ExportService {
  // ------------------------------------------------------------- reads --
  async getExportJob(context, jobId) {
    const job = await exportRepository.findJobById(jobId);
    return assertJobVisible(context, job, jobId);
  }

  /** No Export may exist yet (a presentation not yet exported returns
   * null), so visibility is checked against the Presentation directly
   * rather than through a record that might not exist.
   *
   * WP8: also derives `stale` — Technical Blueprint Rule 35: "An Export
   * Job's output file is content-addressed so staleness is derivable,
   * never separately tracked and allowed to drift." No new stored field,
   * no repository/schema change: computed here, at read time, from two
   * timestamps the Presentation and Export records already carry
   * (`presentation.updatedAt` vs `export.createdAt`), and returned only —
   * never persisted. The Presentation is already fetched above for the
   * visibility check, so this costs no extra read. */
  async getLatestExport(context, presentationId, format) {
    const presentation = await presentationService.getPresentation(context, presentationId);
    const exported = await exportRepository.findLatestExportForPresentation(presentationId, format);
    if (!exported) return null;

    /* Shaped, not spread. `...exported` handed the client `storageRef` — an
     * absolute path on the server's filesystem — which is nobody's business
     * outside this process.
     *
     * `available` matters too: exports used to live in the OS temp directory
     * where macOS deletes them, so the UI kept offering Download on files that
     * were already gone. They live in the app folder now, but a missing file is
     * still possible, and saying so beats a 404 on click. */
    const size = await exportRepository.getExportFileSize(exported.storageRef);
    return {
      id: exported.id,
      presentationId: exported.presentationId,
      format: exported.format,
      version: exported.version,
      contentHash: exported.contentHash,
      createdAt: exported.createdAt,
      size,
      available: size !== null && size !== undefined,
      stale: new Date(presentation.updatedAt) > new Date(exported.createdAt),
    };
  }

  /**
   * WP9: workspace-wide Export Jobs list, backing GET /api/exports (bare
   * collection root). Resolves the caller's workspace presentation set via
   * PresentationService.listWorkspacePresentationSummaries — never
   * presentationRepository directly, per this file's own dependency rule
   * above — then queries the Repository for Export Jobs against that set.
   * A caller-supplied `presentationId` is checked for visibility exactly
   * as getLatestExport already does (404s if not visible, rather than
   * silently returning an empty list); when supplied, it also skips the
   * whole-workspace summary fetch, since a single already-loaded
   * Presentation record carries everything needed.
   *
   * For each Succeeded Job, resolves its Export record via the existing
   * resultExportId link and derives `size` and `stale` at read time —
   * never persisted, the same posture getLatestExport already established
   * for `stale` (Rule 35), extended here to `size` for the same reason.
   */
  async listExports(context, { presentationId, format, limit = 24, offset = 0 } = {}) {
    let presentationById;

    if (presentationId) {
      const presentation = await presentationService.getPresentation(context, presentationId);
      presentationById = new Map([[presentationId, presentation]]);
    } else {
      const summaries = await presentationService.listWorkspacePresentationSummaries(context);
      presentationById = new Map(summaries.map((p) => [p.id, p]));
    }

    const { items: jobs, total } = await exportRepository.findJobsByPresentationIds(
      [...presentationById.keys()],
      { format, limit, offset }
    );

    const items = await Promise.all(
      jobs.map(async (job) => {
        const presentation = presentationById.get(job.presentationId);
        let exportInfo = null;

        if (job.status === "Succeeded" && job.resultExportId) {
          exportInfo = await this._describeExport(await exportRepository.findExportById(job.resultExportId), presentation);
        } else if (job.status === "Failed") {
          // UX Spec §04 / Implementation Spec Screen 08: a Failed row notes
          // the presentation's own latest valid export alongside the error.
          // Reuses the same findLatestExportForPresentation getLatestExport
          // already calls — no new repository method, no new persistence.
          exportInfo = await this._describeExport(
            await exportRepository.findLatestExportForPresentation(job.presentationId, job.format),
            presentation
          );
        }

        return {
          id: job.id,
          presentationId: job.presentationId,
          presentationTitle: presentation ? presentation.title : null,
          format: job.format,
          status: job.status,
          progress: job.progress,
          error: job.error,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          export: exportInfo,
        };
      })
    );

    return { items, total };
  }

  /** Shared by listExports' Succeeded and Failed branches so the derived
   * `size`/`stale` fields (Rule 35) aren't computed twice from two copies
   * of the same object literal. */
  async _describeExport(exported, presentation) {
    if (!exported) return null;
    return {
      id: exported.id,
      version: exported.version,
      createdAt: exported.createdAt,
      contentHash: exported.contentHash,
      size: await exportRepository.getExportFileSize(exported.storageRef),
      stale: presentation ? new Date(presentation.updatedAt) > new Date(exported.createdAt) : false,
    };
  }

  /** Download support (WP6 finding resolution): loads a specific completed
   * Export by id and checks workspace visibility exactly as getExportJob
   * does for Jobs — reusing this Service's one scoping mechanism (load the
   * referenced Presentation, reuse its own assertVisible), per the file
   * header above. */
  async getExportById(context, id) {
    const exported = await exportRepository.findExportById(id);
    return assertExportVisible(context, exported, id);
  }

  /** Download support (WP6 finding resolution): authorizes, then reads the
   * file bytes via the Repository — the only place in this codebase that
   * touches an artifact's actual bytes, not just its JSON metadata. A
   * missing file is normalized to the same ExportNotFoundError a missing
   * record produces: the Route layer needs to know only one error type
   * for "cannot serve this download," never storage internals. */
  async getExportFile(context, id) {
    const exported = await this.getExportById(context, id);
    try {
      const buffer = await exportRepository.readExportFile(exported.storageRef);
      return { exported, buffer };
    } catch (err) {
      if (err instanceof ExportFileNotFoundError) throw new ExportNotFoundError(id);
      throw err;
    }
  }

  // ------------------------------------------------------------- writes --
  /**
   * Backs POST /api/exports. Creates a Queued Export Job only — see the
   * file header for why this never triggers execution itself. Format
   * validity ("pdf" | "pptx") is enforced by the Repository (WP1), not
   * re-checked here, per this codebase's established "repository
   * validation remains authoritative" principle (workspace-repository.js)
   * — a Service re-filtering what the Repository already guards is exactly
   * the class of bug the M3 implementation report already documents and
   * fixed once.
   *
   * WP5: rejects a duplicate active Job (Queued or Running) for the same
   * presentationId + format, server-side — "not UI-only." A different
   * format for the same presentation is unaffected (both may run at once,
   * per UX Spec §08). A prior Failed Job never counts as active — a fresh
   * request after a final failure is exactly "manual retry always
   * available" (Technical Blueprint §09), and correctly creates a new Job,
   * distinct from WP4's own same-Job automatic retry.
   */
  async requestExport(context, presentationId, format) {
    const presentation = await presentationService.getPresentation(context, presentationId); // workspace visibility

    /* A deck with no slides exported as "Succeeded" — a 583-byte PDF with zero
     * pages, and a .pptx with nothing in it. Reporting success for a file
     * nobody can open is worse than refusing. `deleteSlide` already refuses to
     * go below one slide; this is the same invariant on the other side. */
    if (!presentation.slides?.length) {
      throw new EmptyPresentationError(presentationId);
    }

    const [queued, running] = await Promise.all([
      exportRepository.findJobsByStatus("Queued"),
      exportRepository.findJobsByStatus("Running"),
    ]);
    const duplicate = [...queued, ...running].find(
      (j) => j.presentationId === presentationId && j.format === format
    );
    if (duplicate) throw new DuplicateExportJobError(presentationId, format, duplicate.id);

    return exportRepository.insertJob({ presentationId, format });
  }

  // ---- internal status-transition helpers -----------------------------
  // Not called anywhere in this file or by any route/UI code yet — these
  // exist for the Mounting Stage (WP4) to report a Job's progress and
  // outcome once it exists, exactly as WP1's own updateJobStatus/insertJob/
  // insertExport methods exist today with no caller yet either.

  async markRunning(jobId) {
    return exportRepository.updateJobStatus(jobId, { status: "Running" });
  }

  async reportProgress(jobId, progress) {
    return exportRepository.updateJobStatus(jobId, { progress });
  }

  /** Persists the produced Export record, then links it onto the Job via
   * resultExportId as it transitions to Succeeded — the only point in this
   * Service where an Export record is created. */
  async markSucceeded(jobId, { presentationId, format, storageRef, contentHash }) {
    const exported = await exportRepository.insertExport({ presentationId, format, storageRef, contentHash });
    return exportRepository.updateJobStatus(jobId, { status: "Succeeded", resultExportId: exported.id });
  }

  /**
   * @param {string} jobId
   * @param {string} error
   * @param {{cancelled?: boolean}} [options] - forwarded verbatim to the
   *   Repository. Ordinary failures (Running → Failed) never pass this —
   *   `options` defaults to `{}`, identical to this method's behavior
   *   before this parameter existed. `{ cancelled: true }` is the one
   *   named exception that lets a still-Queued Job (never entered Running)
   *   resolve a cancellation, per §09 "Allowed while Queued" — resolving
   *   the gap identified at WP2 sign-off without widening what ordinary
   *   failures are allowed to do.
   */
  async markFailed(jobId, error, options = {}) {
    return exportRepository.updateJobStatus(jobId, { status: "Failed", error: String(error) }, options);
  }

  /** Crash-recovery requeue (heartbeat/timeout sweep, WP4) and retry
   * (manual or the one automatic attempt) both resolve to this same
   * Running/Failed → Queued transition on the SAME Job record — never a
   * new Job, per the approved resolution: "a Job that fails a second time,
   * whether the original attempt or the auto-retry, goes to Failed." */
  async requeue(jobId) {
    return exportRepository.updateJobStatus(jobId, { status: "Queued", error: null });
  }

  /**
   * WP4 correction: exposes ExportRepository.findJobsByStatus for the
   * crash-recovery sweep, keeping Application → Domain → Storage intact —
   * the Gateway (WP4) must not call the Repository directly, the same
   * principle applied to the cancellation-forwarding fix above.
   * Deliberately context-free and cross-workspace, matching the other
   * internal status-transition helpers below: the sweep is a system-level
   * maintenance operation recovering the system's own already-legitimate
   * in-flight work, not a user-scoped query, so there is no per-request
   * context to check it against.
   */
  async findRunningJobs() {
    return exportRepository.findJobsByStatus("Running");
  }

  // ---- cancellation: domain validation only ----------------------------
  /**
   * Technical Blueprint §09: "Allowed while Queued or early in Running;
   * once the Export Pipeline starts walking the DOM, cancellation
   * completes after the current slide, never mid-slide." A Job's `status`
   * field only ever holds Queued/Running/Succeeded/Failed — there is no
   * "mid-walk" sub-state visible at the Domain layer, so the distinction
   * between "early Running" (cancel immediately) and "mid-walk" (defer to
   * after the current slide) is not something this method can or should
   * decide; that timing decision belongs entirely to the Gateway (WP4),
   * which is the only component that knows whether extraction has actually
   * begun. This method's sole job is the domain-level gate: is the Job
   * currently in a status a cancellation may ever apply to at all. It
   * performs no state mutation and no Runtime interaction — the Gateway
   * calls this first, then decides immediate vs. deferred honoring itself,
   * then eventually calls markFailed with a cancellation reason once
   * resolved.
   */
  async validateCancelable(context, jobId) {
    const job = await this.getExportJob(context, jobId);
    if (job.status !== "Queued" && job.status !== "Running") {
      throw new ExportNotCancelableError(jobId, job.status);
    }
    return job;
  }
}

export const exportService = new ExportService();
