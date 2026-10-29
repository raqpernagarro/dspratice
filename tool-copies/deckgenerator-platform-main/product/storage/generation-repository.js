// =============================================================================
// Generation Repository — M15, Storage Layer.
//
// Owns Generation records — the persisted result of an AI Provider call.
// Same JSON-file-backed, shared-mutex pattern every other repository in this
// codebase uses (json-file-store.js), and the same "repository validation
// remains authoritative" posture export-repository.js and
// presentation-repository.js already establish: status transitions are
// enforced here, not in the Service.
//
// No AI logic, no provider calls, no route concerns — storage only.
// =============================================================================
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_DIR as USER_DATA_DIR } from "../infrastructure/user-data.js";
import { readJsonFile, withJsonFile } from "./json-file-store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// User state lives outside the app folder so replacing/updating the app
// can never destroy someone's work — see infrastructure/user-data.js.
const DATA_DIR = USER_DATA_DIR;
const GENERATIONS_FILE = join(DATA_DIR, "generations.json");

/** Generation lifecycle. Mirrors the Technical Blueprint's already-documented
 * Generation Job contract (status/proposedMapping/confidencePerSlide),
 * extended with the approved/discarded terminal states this entity's shape
 * names — those transitions aren't reachable yet (no approve/discard route
 * exists in this phase), but the table is written now so a later phase
 * doesn't need to touch this file to add them. */
/* `approving` is the claim held while composition runs.
 *
 * Composition takes one to four minutes, which is longer than a browser will
 * hold a request open, so approval is asynchronous: the claim is taken, the
 * response returns immediately, and the client polls. The state has to be
 * durable rather than in-memory so a second caller (or a second tab) can see
 * that the work is already under way.
 *
 * approving -> completed is the compensating rollback when composition or
 * presentation creation fails, so the user can retry. A process that dies
 * mid-composition leaves a record stranded in `approving`; the sweep in
 * generation-service.releaseStrandedApprovals() clears those at boot (and
 * fails any `pending` record a background draft left behind). */
const VALID_TRANSITIONS = {
  pending: ["completed", "failed"],
  completed: ["approving", "discarded"],
  approving: ["approved", "completed"],
  failed: [],
  approved: ["completed"],
  discarded: [],
};

const GENERATION_IMMUTABLE = ["id", "workspaceId", "userId", "prompt", "createdAt"];

export class InvalidGenerationTransitionError extends Error {
  constructor(from, to) {
    super(`Invalid Generation status transition: "${from}" → "${to}".`);
    this.name = "InvalidGenerationTransitionError";
    this.from = from;
    this.to = to;
  }
}

export class GenerationRepository {
  /** Every generation, all workspaces. Used only by the boot-time sweep that
   *  releases approvals stranded by a crash — never by a request path, which
   *  must always scope to the caller's workspace. */
  async findAll() {
    return structuredClone(await readJsonFile(GENERATIONS_FILE));
  }

  async findById(id) {
    const all = await readJsonFile(GENERATIONS_FILE);
    const found = all.find((g) => g.id === id) || null;
    return found ? structuredClone(found) : null;
  }

  /**
   * @param {object} data - workspaceId (required), userId (required),
   *   prompt (required). Always created in "pending" status — the caller
   *   never sets the initial status directly, matching
   *   ExportRepository.insertJob's identical posture for "Queued".
   */
  async insert(data) {
    if (!data || !data.workspaceId) throw new Error("Generation.workspaceId is required.");
    if (!data || !data.userId) throw new Error("Generation.userId is required.");
    if (!data || typeof data.prompt !== "string" || !data.prompt.trim()) {
      throw new Error("Generation.prompt is required.");
    }

    const now = new Date().toISOString();
    const record = {
      id: randomUUID(),
      workspaceId: data.workspaceId,
      userId: data.userId,
      status: "pending",
      prompt: data.prompt.trim(),
      // "prompt" | "import" — which creation path produced this generation.
      // Carried onto the presentation it eventually creates.
      origin: data.origin === "import" ? "import" : "prompt",
      // "source" | "brand" — which images an imported deck's slides use.
      // Meaningless for a prompt-generated deck, but always stored so
      // consumers (composeSlides) don't need an origin check to read it.
      imageSource: data.imageSource === "brand" ? "brand" : "source",
      // The prompt coach's record ({ missing, asked, answered, source,
      // skipped }), sanitized by the domain; null when the coach never opened.
      coaching: data.coaching && typeof data.coaching === "object" ? data.coaching : null,
      // The intelligence layer's inputs (cleaned by the domain) and outputs.
      // `answers` are the coach answers by question id; `wantsHook` and
      // `slideCount` shape the story and outline; `referenceIds` name the
      // person's own material. `brief` and `story` are written once drafting
      // has run them; `notes` says, in words, any step that was skipped.
      answers: data.answers && typeof data.answers === "object" && !Array.isArray(data.answers) ? data.answers : {},
      wantsHook: data.wantsHook !== false,
      slideCount: Number.isInteger(data.slideCount) ? data.slideCount : null,
      referenceIds: Array.isArray(data.referenceIds) ? data.referenceIds : [],
      brief: null,
      story: null,
      notes: [],
      proposedMapping: null,
      confidencePerSlide: null,
      output: null,
      usage: null,
      // MVP Sprint 1: a real provider has real, non-theoretical failure
      // modes (CLI not on PATH, not authenticated, malformed response,
      // timeout) — the caller needs to know why, not just that it failed.
      error: null,
      // Set once, on the completed → approved transition (Phase 4 M15), by
      // GenerationService.approveGeneration — never set at creation.
      presentationId: null,
      createdAt: now,
      updatedAt: now,
    };

    return withJsonFile(GENERATIONS_FILE, async (all) => {
      all.push(record);
      return { records: all, result: structuredClone(record) };
    });
  }

  /**
   * @param {string} id
   * @param {object} changes - any of status, proposedMapping,
   *   confidencePerSlide, output, usage, progress, brief, story, notes.
   */
  async updateStatus(id, changes = {}) {
    for (const field of GENERATION_IMMUTABLE) {
      if (Object.prototype.hasOwnProperty.call(changes, field)) {
        throw new Error(`Generation.${field} is immutable and cannot be changed.`);
      }
    }

    return withJsonFile(GENERATIONS_FILE, async (all) => {
      const index = all.findIndex((g) => g.id === id);
      if (index === -1) throw new Error(`Generation ${id} not found.`);
      const record = all[index];

      /* Every status write is validated, INCLUDING a same-status one.
       *
       * This used to skip the check when `changes.status === record.status`,
       * which quietly made re-approving legal: `approved` lists only
       * `completed` as a valid target, so approved -> approved should be
       * rejected, and instead it bypassed the table entirely and succeeded.
       * That is how a double-click, or the client's retry after its own
       * timeout, produced two and three copies of the same deck — the
       * "compare-and-set" the approval path documents never actually set. */
      if (changes.status) {
        const allowed = VALID_TRANSITIONS[record.status] || [];
        if (!allowed.includes(changes.status)) {
          throw new InvalidGenerationTransitionError(record.status, changes.status);
        }
      }

      Object.assign(record, changes);
      record.updatedAt = new Date().toISOString();

      all[index] = record;
      return { records: all, result: structuredClone(record) };
    });
  }
}

export const generationRepository = new GenerationRepository();
