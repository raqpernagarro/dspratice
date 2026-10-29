// =============================================================================
// Export Repository — Milestone M10, Storage Layer (Phase 2.5 §04/§06).
//
// Owns exactly what the Technical Blueprint assigns to it: Export Job and
// Export. Read: findJobById, findLatestExportForPresentation. Write:
// insertJob, updateJobStatus, insertExport — the same three write methods
// the Blueprint names, nothing more.
//
// No workspaceId field on either record (approved M10 implementation
// decision, Step 1.5 Finding 6): authorization is always done by loading the
// referenced Presentation via presentationId and checking its workspace,
// identical to every existing repository in this codebase. Adding a
// denormalized workspaceId here would be a second, redundant source of
// truth for something Presentation already owns.
//
// Export Job's status transitions are enforced here, not left to the Domain
// Service, following the same "repository validation remains authoritative"
// principle workspace-repository.js already establishes. The transition
// table below is drawn directly from Technical Blueprint §09's Export Jobs
// lifecycle (Queued → Running → Succeeded/Failed) plus its Retry line
// ("Failed → Queued: retry") and Recovery line ("a crashed worker's
// in-flight Job is requeued via a heartbeat/timeout sweep" — Running →
// Queued). Both the manual-retry and the crash-recovery requeue produce the
// identical Running → Queued... → Succeeded/Failed transition on the SAME
// Job record — no second Job is ever created for a retry, matching the
// approved resolution for M10 Decision 1 ("a Job that fails a second time,
// whether the original attempt or the auto-retry, goes to Failed").
//
// WP1 defect correction: §09's Cancellation line — "Allowed while Queued or
// early in Running" — requires a Queued Job to be resolvable to a terminal
// state without ever entering Running, which the table above does not
// provide for on its own (Queued's only listed target is Running). Rather
// than widen VALID_TRANSITIONS.Queued generally — which would also legalize
// an ordinary, non-cancellation Queued → Failed write, something no
// governing text supports and the Generation Jobs' parallel diagram
// (Failed only reachable from its Running-equivalent state, never from
// Queued) argues against — updateJobStatus() below accepts an explicit
// `{ cancelled: true }` option, mirroring presentation-repository.js's own
// `{ allowOverride: true }` pattern for narrowing an otherwise-disallowed
// write to one named, deliberate cause. Only that one call shape may
// resolve Queued → Failed; every other caller is still rejected exactly as
// before this patch.
//
// No caching layer: the Technical Blueprint notes
// findLatestExportForPresentation "is cached, invalidated by a content-hash
// change" as this repository's eventual behavior, but no repository in this
// codebase implements caching today except presentation-repository.js's own
// findById (a much hotter path — every page load, not just export-status
// polling). Given the JSON-file store's trivial read cost at this scale,
// omitting a cache changes no observable behavior and matches
// workspace-repository.js's simpler, uncached precedent.
//
// WP1 Storage Correction: reads and writes below go through
// json-file-store.js, shared with presentation-repository.js, rather than
// this file keeping its own private readJsonFile/writeJsonFile pair. Every
// write (insertJob, updateJobStatus, insertExport) now runs as one
// serialized critical section per file path — closing a lost-write race
// found live during WP6 verification (two concurrent POST /api/exports
// both returned 201, but only one Job was ever persisted). See
// json-file-store.js's header for the full account. No schema, API, or
// business-logic change: every method below keeps its exact original
// validation order, error types, and return shape.
// =============================================================================
import { randomUUID } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_DIR as USER_DATA_DIR } from "../infrastructure/user-data.js";
import { readJsonFile, withJsonFile } from "./json-file-store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// User state lives outside the app folder so replacing/updating the app
// can never destroy someone's work — see infrastructure/user-data.js.
const DATA_DIR = USER_DATA_DIR;
const EXPORT_JOBS_FILE = join(DATA_DIR, "exportJobs.json");
const EXPORTS_FILE = join(DATA_DIR, "exports.json");

/** Export Job lifecycle — Technical Blueprint §09. */
const VALID_TRANSITIONS = {
  Queued: ["Running"],
  Running: ["Succeeded", "Failed", "Queued"], // Queued = crash-recovery requeue (Recovery)
  Failed: ["Queued"], // manual or automatic retry
  Succeeded: [],
};

const EXPORT_JOB_IMMUTABLE = ["id", "presentationId", "format", "createdAt"];

export class InvalidExportJobTransitionError extends Error {
  constructor(from, to) {
    super(`Invalid Export Job status transition: "${from}" → "${to}".`);
    this.name = "InvalidExportJobTransitionError";
    this.from = from;
    this.to = to;
  }
}

/** Download support: the Export record's metadata exists (findExportById
 * found it), but the file at its storageRef is gone from disk — e.g. an
 * os.tmpdir() sweep. Distinct from "no Export record at all" so a caller
 * can tell the two apart if it ever needs to; both map to 404 at the route
 * today, matching this codebase's existing "not found, not disclosed"
 * posture for every other missing-resource case. */
export class ExportFileNotFoundError extends Error {
  constructor(storageRef) {
    super(`Export file not found at ${storageRef}.`);
    this.name = "ExportFileNotFoundError";
    this.storageRef = storageRef;
  }
}

export class ExportRepository {
  // -------------------------------------------------------------- reads --
  async findJobById(id) {
    const all = await readJsonFile(EXPORT_JOBS_FILE);
    const found = all.find((j) => j.id === id) || null;
    return found ? structuredClone(found) : null;
  }

  /** Latest Export for a presentation, scoped to one format — Technical
   * Blueprint §06. "Latest" is the most recently created row; no separate
   * version-ordering field is trusted over createdAt. */
  async findLatestExportForPresentation(presentationId, format) {
    const all = await readJsonFile(EXPORTS_FILE);
    const matches = all.filter((e) => e.presentationId === presentationId && e.format === format);
    if (matches.length === 0) return null;
    matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return structuredClone(matches[0]);
  }

  /** Download support (WP6 finding resolution): the one lookup missing to
   * serve a specific completed Export's file — every existing read here
   * either returns a Job (findJobById) or the *latest* Export for a
   * presentation+format (findLatestExportForPresentation), neither of
   * which lets a caller fetch the exact Export a client already holds an
   * id for (the Succeeded panel state's own `exported.id`, returned by
   * getLatestExport). Mirrors findJobById's exact shape. */
  async findExportById(id) {
    const all = await readJsonFile(EXPORTS_FILE);
    const found = all.find((e) => e.id === id) || null;
    return found ? structuredClone(found) : null;
  }

  /** Reads a completed Export's actual file bytes from its storageRef.
   * The only place in this repository that touches binary artifact
   * content rather than the JSON metadata store — kept here, not in the
   * Domain or Route layer, so every filesystem access this subsystem
   * performs (metadata and binary alike) stays inside the Storage layer. */
  async readExportFile(storageRef) {
    try {
      return await readFile(storageRef);
    } catch (err) {
      if (err.code === "ENOENT") throw new ExportFileNotFoundError(storageRef);
      throw err;
    }
  }

  /**
   * WP4 correction: the minimum read needed for §09's heartbeat/timeout
   * recovery sweep — "A crashed worker's in-flight Job is requeued via a
   * heartbeat/timeout sweep." An in-memory-only worker has no way to
   * rediscover its own in-flight work after a crash; this reads persisted
   * state directly, matching the same filter-over-readJsonFile shape every
   * other read in this codebase already uses (e.g.
   * presentation-repository.js's findByWorkspace). No schema change, no
   * new field, no workspaceId — purely a query over the existing `status`
   * field.
   */
  async findJobsByStatus(status) {
    const all = await readJsonFile(EXPORT_JOBS_FILE);
    return all.filter((j) => j.status === status).map((j) => structuredClone(j));
  }

  /**
   * WP9: the minimum read the "Export Jobs" screen's workspace-wide list
   * needs. Filtered to a caller-supplied set of presentation ids — this
   * repository has no workspaceId concept of its own (file header), so the
   * Service resolves which ids belong to the caller's workspace via
   * PresentationService and passes them in here, exactly as every other
   * cross-entity workspace check in this codebase works by loading the
   * referenced Presentation rather than by a denormalized field on this
   * record. Optionally filtered by format. Sorted most-recently-updated
   * first, unconditionally — the UX Spec's own fixed default for this
   * screen ("an explicit sort control exists only on Library... added
   * elsewhere only if demonstrated need arises"), no caller-supplied sort.
   * Paginated into the same { items, total } shape
   * presentationRepository.findByWorkspace's own caller
   * (listPresentations) already returns, so the route can reuse the exact
   * X-Total-Count convention GET /api/presentations already established.
   *
   * @param {string[]} presentationIds
   * @param {{format?: "pdf"|"pptx", limit?: number, offset?: number}} [opts]
   */
  async findJobsByPresentationIds(presentationIds, { format, limit = 24, offset = 0 } = {}) {
    const all = await readJsonFile(EXPORT_JOBS_FILE);
    const idSet = new Set(presentationIds);
    let matches = all.filter((j) => idSet.has(j.presentationId));
    if (format) matches = matches.filter((j) => j.format === format);
    matches.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const total = matches.length;
    const page = matches.slice(offset, offset + limit).map((j) => structuredClone(j));
    return { items: page, total };
  }

  /**
   * WP9: derives a completed Export's file size at read time — the same
   * "derivable, never separately tracked" posture Rule 35 already
   * established for staleness (WP8), applied here to size instead, and
   * kept in this repository for the same reason readExportFile is: the
   * only place this subsystem touches an artifact's actual filesystem
   * state, never the Domain or Route layer. Returns null rather than
   * throwing when the file has evaporated from os.tmpdir() (an already
   * disclosed, accepted limitation) — one row's missing file must not
   * fail the whole list, matching this codebase's established "one item's
   * failure never blanks the list" precedent (e.g. presentations.js's
   * thumbnail-fetch failure handling).
   */
  async getExportFileSize(storageRef) {
    try {
      const stats = await stat(storageRef);
      return stats.size;
    } catch {
      return null;
    }
  }

  // ------------------------------------------------------------- writes --
  /**
   * @param {object} data - presentationId (required), format (required,
   *   "pdf" | "pptx").
   */
  async insertJob(data) {
    if (!data || !data.presentationId) {
      throw new Error("ExportJob.presentationId is required.");
    }
    if (!data || (data.format !== "pdf" && data.format !== "pptx")) {
      throw new Error('ExportJob.format must be "pdf" or "pptx".');
    }

    const now = new Date().toISOString();
    const record = {
      id: randomUUID(),
      presentationId: data.presentationId,
      format: data.format,
      status: "Queued",
      progress: null,
      error: null,
      resultExportId: null,
      createdAt: now,
      updatedAt: now,
    };

    return withJsonFile(EXPORT_JOBS_FILE, async (all) => {
      all.push(record);
      return { records: all, result: structuredClone(record) };
    });
  }

  /**
   * @param {string} id
   * @param {object} changes - any of status, progress, error, resultExportId.
   *   A `status` change is validated against the transition table above.
   * @param {{cancelled?: boolean}} options - `cancelled: true` is the one
   *   named exception permitting Queued → Failed, for resolving a
   *   cancellation of a Job that never entered Running (§09
   *   "Allowed while Queued"). No other transition is affected by this
   *   option, and no other means of reaching Queued → Failed exists.
   */
  async updateJobStatus(id, changes = {}, options = {}) {
    for (const field of EXPORT_JOB_IMMUTABLE) {
      if (Object.prototype.hasOwnProperty.call(changes, field)) {
        throw new Error(`ExportJob.${field} is immutable and cannot be changed.`);
      }
    }

    return withJsonFile(EXPORT_JOBS_FILE, async (all) => {
      const index = all.findIndex((j) => j.id === id);
      if (index === -1) throw new Error(`Export Job ${id} not found.`);
      const record = all[index];

      if (changes.status && changes.status !== record.status) {
        const allowed = VALID_TRANSITIONS[record.status] || [];
        const isQueuedCancellation =
          options.cancelled === true && record.status === "Queued" && changes.status === "Failed";
        if (!allowed.includes(changes.status) && !isQueuedCancellation) {
          throw new InvalidExportJobTransitionError(record.status, changes.status);
        }
      }

      Object.assign(record, changes);
      record.updatedAt = new Date().toISOString();

      all[index] = record;
      return { records: all, result: structuredClone(record) };
    });
  }

  /**
   * @param {object} data - presentationId, format, storageRef, contentHash
   *   (all required). `version` is computed here — the count of prior
   *   Exports for the same presentationId+format, plus one — via a
   *   repository insert, never a directory scan (the original CLI's own
   *   `nextVersion()` race, identified during the M10 adversarial review,
   *   does not recur here).
   */
  async insertExport(data) {
    if (!data || !data.presentationId) throw new Error("Export.presentationId is required.");
    if (!data || (data.format !== "pdf" && data.format !== "pptx")) {
      throw new Error('Export.format must be "pdf" or "pptx".');
    }
    if (!data.storageRef) throw new Error("Export.storageRef is required.");
    if (!data.contentHash) throw new Error("Export.contentHash is required.");

    return withJsonFile(EXPORTS_FILE, async (all) => {
      const priorCount = all.filter(
        (e) => e.presentationId === data.presentationId && e.format === data.format
      ).length;

      const record = {
        id: randomUUID(),
        presentationId: data.presentationId,
        format: data.format,
        version: priorCount + 1,
        storageRef: data.storageRef,
        contentHash: data.contentHash,
        createdAt: new Date().toISOString(),
      };

      all.push(record);
      return { records: all, result: structuredClone(record) };
    });
  }
}

export const exportRepository = new ExportRepository();
