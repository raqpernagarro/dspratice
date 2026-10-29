// =============================================================================
// Presentation Repository — Milestone M2, Storage Layer (Phase 2.5 §02/§05).
//
// Owns exactly what Phase 2.5 §05 assigns to it: Presentation, Slide, Version.
// Read: findById, findByWorkspace, search. Write: insert, update, delete.
//
// This file is the Storage Layer. Per Phase 2.5 §03's dependency table, the
// Storage Layer never calls the Rendering Layer — so, deliberately, this
// module never imports js/templates/index.js or validates a slide's
// `templateName` against the real registry. Phase 1 Rule 19 assigns that
// validation to "the API boundary" and to the engine's own getTemplate()
// throw at render time — both outside this layer, and neither exists yet
// (Backend API is Milestone M3). Omitting that check here is a deliberate,
// spec-compliant boundary, not a missed requirement.
//
// Similarly, this module does not assemble buildStage()-ready output. That
// is Presentation Service.buildDeckDefinition() (Phase 2.5 §04) — Domain
// Layer, not Storage Layer — and per the approved M2 decision, its
// construction is deferred to Milestone M3, when the Service layer is
// introduced. M2's own manual validation is instead proven with a temporary,
// disposable script (see the M2 implementation report), never with
// production code living in this file.
//
// WP1 Storage Correction: reads and writes below go through
// json-file-store.js, shared with export-repository.js, rather than this
// file keeping its own private readJsonFile/writeJsonFile pair. Every write
// (insert, update, delete, insertVersion) now runs as one serialized
// critical section per file path — the same whole-file read-modify-write
// pattern export-repository.js had, and the same lost-write race applies
// here even though it was found via Export Jobs. See json-file-store.js's
// header for the full account. No schema, API, or business-logic change:
// every method below keeps its exact original validation order (including
// the read-through cache's invalidation timing — always strictly after the
// write it invalidates, matching the original placement), error types, and
// return shape.
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
const PRESENTATIONS_FILE = join(DATA_DIR, "presentations.json");
const VERSIONS_FILE = join(DATA_DIR, "versions.json");

/** Presentation lifecycle — Phase 2 §03. Failed is reachable from Analysed,
 * Generating, or Exported; retry re-enters whichever state failed, so all
 * three are valid outbound targets from Failed.
 *
 * Milestone M6 decision A: Phase 2's own diagram only draws Generated/
 * Exported → Archived, because it assumes every presentation passes through
 * the full generation pipeline first. M5 introduced manual creation directly
 * into Ready, and M6's Library screen requires archiving to work on exactly
 * those presentations — the only kind this system can currently produce. */
const VALID_TRANSITIONS = {
  Imported: ["Analysed"],
  Analysed: ["AwaitingMapping", "Failed"],
  AwaitingMapping: ["Ready"],
  Ready: ["Generating", "Archived"],
  Generating: ["Generated", "Failed"],
  Generated: ["Edited", "Exported", "Archived"],
  Edited: ["Generating", "Exported"],
  Exported: ["Edited", "Archived", "Failed"],
  Archived: ["Ready"],
  Failed: ["Analysed", "Generating", "Exported"],
};

/** Presentation's immutable fields — Phase 2.5 §07. */
const PRESENTATION_IMMUTABLE = ["id", "workspaceId", "createdAt"];
/** Slide's immutable fields — Phase 2.5 §07. */
const SLIDE_IMMUTABLE = ["id", "presentationId", "sourceSlideRef"];

export class ManualOverrideConflictError extends Error {
  constructor(slideId, field) {
    super(`Slide ${slideId} field "${field}" is manually overridden and cannot be silently rewritten.`);
    this.name = "ManualOverrideConflictError";
    this.slideId = slideId;
    this.field = field;
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(from, to) {
    super(`Invalid Presentation status transition: "${from}" → "${to}".`);
    this.name = "InvalidStatusTransitionError";
    this.from = from;
    this.to = to;
  }
}

/** aiMemory shape/limit violations — Phase 3 §3. */
export class AiMemoryValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AiMemoryValidationError";
  }
}

/** A slide patch names a template that doesn't exist in the real registry —
 * see setTemplateNameValidator() below for why this is checked here. */
export class UnknownTemplateReferenceError extends Error {
  constructor(templateName) {
    super(`Slide.templateReference.templateName "${templateName}" is not a registered template.`);
    this.name = "UnknownTemplateReferenceError";
    this.templateName = templateName;
  }
}

// Every documented write path (swapSlideTemplate, addSlide — Presentation
// Service) already validates a templateName against the real template
// registry before ever reaching this repository, and this file deliberately
// never imports js/templates/index.js itself (Rule 19 — the Storage Layer
// doesn't depend on the Rendering Layer). That left this per-slide patch
// path trusting ANY caller's templateReference verbatim: nothing here stops
// an unregistered name from being silently persisted and only failing much
// later, in the browser, as "This slide can't be rendered yet." A slide
// really did end up in exactly that state on a live deck with no
// discoverable in-app path that could have written it — meaning whatever
// caused it reached this method directly, bypassing every validated route.
//
// Presentation Service calls setTemplateNameValidator() once at startup,
// binding this check to the real registry without this file ever importing
// it — the validator is a plain function, not a template. Any caller that
// never registers one (e.g. a repository test constructed in isolation)
// gets today's original, unvalidated behavior.
let templateNameValidator = null;
export function setTemplateNameValidator(fn) { templateNameValidator = fn; }

const AI_MEMORY_MAX_ENTRIES = 20;
const AI_MEMORY_TEXT_MAX = 200;

/**
 * Validates and normalizes a PATCH `aiMemory` payload against the record's
 * existing entries (so `createdAt` survives an edit to an existing fact).
 * Unknown keys are stripped; ids are assigned for new entries. `text` is
 * stored as raw, unescaped user input — any renderer (the editor panel's
 * Memory UI) must HTML-escape it, the same as every other free-text field.
 */
function normalizeAiMemory(value, existing = []) {
  if (!Array.isArray(value)) {
    throw new AiMemoryValidationError("Presentation.aiMemory must be an array.");
  }
  const existingById = new Map((existing || []).map((e) => [e.id, e]));
  const now = new Date().toISOString();
  const normalized = value.map((entry) => {
    if (!entry || typeof entry.text !== "string" || !entry.text.trim()) {
      throw new AiMemoryValidationError("Presentation.aiMemory entries require non-empty text.");
    }
    const id = typeof entry.id === "string" && entry.id ? entry.id : randomUUID();
    const prior = existingById.get(id);
    return {
      id,
      text: entry.text.trim().slice(0, AI_MEMORY_TEXT_MAX),
      pinned: !!entry.pinned,
      createdAt: prior ? prior.createdAt : now,
    };
  });

  // De-dupe ids within THIS payload — a caller sending two entries with the
  // same id (e.g. a UI double-submit) would otherwise persist both, and
  // id-keyed lookups downstream (edit/pin/delete by id) need a unique key.
  // Last-write-wins: the later entry's text/pinned wins, kept at the LAST
  // occurrence's array position (simplest correct behavior).
  const lastIndexById = new Map();
  normalized.forEach((entry, i) => lastIndexById.set(entry.id, i));
  const deduped = normalized.filter((entry, i) => lastIndexById.get(entry.id) === i);

  // Cap applies to the deduped length — a payload with duplicate ids that
  // collapse under 20 unique entries should not be rejected.
  if (deduped.length > AI_MEMORY_MAX_ENTRIES) {
    throw new AiMemoryValidationError(`Presentation.aiMemory must have at most ${AI_MEMORY_MAX_ENTRIES} entries.`);
  }

  return deduped;
}

// ---- Short-lived read cache, keyed by id — Phase 2.5 §05 ------------------
// Invalidated on any write to the same aggregate, expired by TTL (another
// process — an exporter, a second server — may write the same file), and
// bounded so it can't grow with every record ever read.
const cache = new Map(); // id -> { record, at }
const CACHE_TTL_MS = 5_000;
const CACHE_MAX_ENTRIES = 200;

export class PresentationRepository {
  // -------------------------------------------------------------- reads --
  async findById(id) {
    const hit = cache.get(id);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return structuredClone(hit.record);
    if (hit) cache.delete(id);
    const all = await readJsonFile(PRESENTATIONS_FILE);
    const record = all.find((p) => p.id === id) || null;
    if (record) {
      if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value);
      cache.set(id, { record: structuredClone(record), at: Date.now() });
    }
    return record ? structuredClone(record) : null;
  }

  async findByWorkspace(workspaceId) {
    const all = await readJsonFile(PRESENTATIONS_FILE);
    return all.filter((p) => p.workspaceId === workspaceId).map((p) => structuredClone(p));
  }

  /** Matches title only — Phase 3 §13. */
  async search(workspaceId, query) {
    const scoped = await this.findByWorkspace(workspaceId);
    const q = String(query || "").trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((p) => p.title.toLowerCase().includes(q));
  }

  // ------------------------------------------------------------- writes --
  /**
   * @param {object} data - title (required), workspaceId (required),
   *   ownerId, status, basedOnTemplatePackId, description, footer, slides.
   */
  async insert(data) {
    if (!data || typeof data.title !== "string" || !data.title.trim()) {
      throw new Error("Presentation.title is required.");
    }
    if (!data.workspaceId) {
      throw new Error("Presentation.workspaceId is required.");
    }

    const now = new Date().toISOString();
    const record = {
      id: randomUUID(),
      title: data.title.trim(),
      description: data.description ?? "",
      workspaceId: data.workspaceId,
      ownerId: data.ownerId ?? null,
      status: data.status || "Ready",
      basedOnTemplatePackId: data.basedOnTemplatePackId ?? null,
      // "prompt" | "import" — how the deck was created. Absent on records
      // that predate the field; readers treat that as "prompt".
      origin: data.origin === "import" ? "import" : "prompt",
      // { count, total } when composition left slides on the default layout.
      layoutFallback: data.layoutFallback ?? null,
      currentVersionId: null,
      footer: data.footer ?? undefined,
      createdAt: now,
      updatedAt: now,
      slides: (data.slides || []).map((s) => normalizeSlideOnInsert(s)),
    };

    const result = await withJsonFile(PRESENTATIONS_FILE, async (all) => {
      all.push(record);
      return { records: all, result: structuredClone(record) };
    });
    cache.set(record.id, { record: structuredClone(record), at: Date.now() });
    return result;
  }

  /**
   * @param {string} id
   * @param {object} changes - any mutable Presentation field, and/or a
   *   `slides` array of { id, ...contentChanges } patches.
   * @param {{allowOverride?: boolean}} options
   */
  async update(id, changes, options = {}) {
    // Milestone M7: `insert()` has always required a non-empty title, but
    // `update()` never mirrored that check — invisible until M7's rename
    // feature became the first real caller to ever PATCH a title at all.
    if (changes && Object.prototype.hasOwnProperty.call(changes, "title")) {
      if (typeof changes.title !== "string" || !changes.title.trim()) {
        throw new Error("Presentation.title is required.");
      }
    }

    const result = await withJsonFile(PRESENTATIONS_FILE, async (all) => {
      const index = all.findIndex((p) => p.id === id);
      if (index === -1) throw new Error(`Presentation ${id} not found.`);
      const record = all[index];

      for (const field of PRESENTATION_IMMUTABLE) {
        if (changes && Object.prototype.hasOwnProperty.call(changes, field)) {
          throw new Error(`Presentation.${field} is immutable and cannot be changed.`);
        }
      }

      if (changes && changes.status && changes.status !== record.status) {
        const allowed = VALID_TRANSITIONS[record.status] || [];
        if (!allowed.includes(changes.status)) {
          throw new InvalidStatusTransitionError(record.status, changes.status);
        }
      }

      // Structural slide changes (add / duplicate / delete / reorder) replace
      // the whole array rather than patching by id, which the merge path
      // below cannot express — it can only find and mutate slides that
      // already exist. Existing slides keep their id (so undo, manual
      // overrides and export history all stay attached to the same slide);
      // entries without one are new and get a fresh id from the same
      // normalizer insert() uses, so a slide added here is indistinguishable
      // from one created with the presentation.
      if (changes && Array.isArray(changes.slides) && options.replaceSlides) {
        record.slides = changes.slides.map((s, index) =>
          s.id && record.slides.some((existing) => existing.id === s.id)
            ? { ...record.slides.find((existing) => existing.id === s.id), ...s, order: index }
            : { ...normalizeSlideOnInsert(s), order: index }
        );
      } else if (changes && Array.isArray(changes.slides)) {
        for (const patch of changes.slides) {
          const slide = record.slides.find((s) => s.id === patch.id);
          if (!slide) throw new Error(`Slide ${patch.id} not found on presentation ${id}.`);

          for (const field of SLIDE_IMMUTABLE) {
            if (Object.prototype.hasOwnProperty.call(patch, field) && patch[field] !== slide[field]) {
              throw new Error(`Slide.${field} is immutable and cannot be changed.`);
            }
          }

          if (!options.allowOverride) {
            for (const field of Object.keys(patch.content || {})) {
              if (slide.manualOverrides && slide.manualOverrides[field]) {
                throw new ManualOverrideConflictError(slide.id, field);
              }
            }
          }

          // REPLACED, not merged, when the caller passes replaceContent: true
          // (e.g. a template swap, which computes the new template's full
          // content and intentionally drops fields that don't map onto it —
          // a merge would leave those dropped fields orphaned in storage
          // forever, invisible to the new template's render() but still
          // present in the JSON). Plain content edits still merge.
          if (patch.content) {
            if (patch.replaceContent) slide.content = patch.content;
            else Object.assign(slide.content, patch.content);
          }
          if (patch.templateReference) {
            const name = patch.templateReference.templateName;
            if (templateNameValidator && !templateNameValidator(name)) {
              throw new UnknownTemplateReferenceError(name);
            }
            slide.templateReference = patch.templateReference;
          }
          if (patch.themeOverride !== undefined) slide.themeOverride = patch.themeOverride;
          if (patch.order !== undefined) slide.order = patch.order;
          if (patch.manualOverrides) Object.assign(slide.manualOverrides, patch.manualOverrides);
          // REPLACED, not merged, unlike the two maps above: removing a
          // style is how "reset this element to the template" is expressed,
          // and a merge could never express a removal. The Editor always
          // sends the slide's complete override map.
          if (patch.styleOverrides) slide.styleOverrides = patch.styleOverrides;
          slide.lastEditedBy = patch.lastEditedBy ?? slide.lastEditedBy;
          slide.lastEditedAt = new Date().toISOString();
        }
      }

      // Whitelist, not blacklist: a PATCH may only touch the fields a user
      // legitimately edits. Anything else (ownerId, currentVersionId, ...)
      // is dropped — assigning ownerId would let an editor grant themselves
      // permanent ownership.
      const MUTABLE_FIELDS = ["title", "description", "footer", "status", "basedOnTemplatePackId", "aiMemory"];
      for (const field of MUTABLE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(changes || {}, field)) {
          record[field] = field === "aiMemory" ? normalizeAiMemory(changes[field], record.aiMemory) : changes[field];
        }
      }
      record.updatedAt = new Date().toISOString();

      all[index] = record;
      return { records: all, result: structuredClone(record) };
    });
    cache.delete(id);
    return result;
  }

  async delete(id) {
    const changed = await withJsonFile(PRESENTATIONS_FILE, async (all) => {
      const next = all.filter((p) => p.id !== id);
      const didChange = next.length !== all.length;
      // Skip the write entirely when nothing matched — mirrors the
      // original's `if (changed) { write; ... }` guard exactly.
      return didChange ? { records: next, result: true } : { records: undefined, result: false };
    });
    if (changed) cache.delete(id);
    return changed;
  }
}

function normalizeSlideOnInsert(s) {
  return {
    id: randomUUID(),
    order: s.order ?? 0,
    templateReference: s.templateReference,
    themeOverride: s.themeOverride,
    content: s.content || {},
    manualOverrides: s.manualOverrides || {},
    styleOverrides: s.styleOverrides || {},
    sourceSlideRef: s.sourceSlideRef ?? null,
    // "hook" marks the outline's hook slide (later passes find it by this).
    ...(s.role === "hook" ? { role: "hook" } : {}),
    lastEditedBy: null,
    lastEditedAt: null,
  };
}

export const presentationRepository = new PresentationRepository();
