// =============================================================================
// Presentation Service — Milestone M3, Domain Layer (Phase 2.5 §02/§04).
// Extended M9.
//
// Scope note: Phase 2.5 §04 lists ten public methods for this Service.
// M3 built the seven Presentation CRUD methods. M9 adds updateSlide and
// swapSlideTemplate. The Editor MVP redesign adds addSlide, duplicateSlide,
// deleteSlide and reorderSlides (drag-to-reorder in the navigator) — all
// four share the repository's replaceSlides path, which re-derives `order`
// from array position so it can never drift out of sync with the real
// sequence.
//
// Per the approved architectural constraint: this is the ONLY component
// permitted to assemble the {meta, slides} deck-definition object the
// Rendering Engine consumes. The Repository (product/storage) never
// contains this logic — it is a persistence component only.
// =============================================================================
import { presentationRepository, ManualOverrideConflictError, setTemplateNameValidator } from "../storage/presentation-repository.js";
import { allTemplates } from "../../js/templates/index.js";
import { prepareContentUpdate, assertRenders, fieldKind, SlideContentInvalidError } from "./slide-content.js";
import { sanitizeStyleOverrides, SlideStyleInvalidError } from "./slide-style.js";

export { SlideStyleInvalidError };

// Binds the repository's defense-in-depth template-name check (see
// UnknownTemplateReferenceError in presentation-repository.js) to the real
// registry, without the repository ever importing the Rendering Layer
// itself. This is the ONE place allowed to know both the registry and the
// repository, so it's the natural place to introduce them.
setTemplateNameValidator((name) => allTemplates.some((t) => t.name === name));

// Milestone M4 replaced M3's temporary DEFAULT_WORKSPACE_ID with real,
// session-derived scoping. Every method below now takes an explicit,
// immutable context — { userId, workspaceId, role } — as its first
// argument (Decision K). Domain code never receives an HTTP request; the
// Application Layer's session middleware builds the context and passes it
// in. There is no longer any fallback workspace anywhere in this file: a
// caller without a context cannot reach these methods, because the
// Application Layer rejects the request first.

export class PresentationNotFoundError extends Error {
  constructor(id) {
    super(`Presentation ${id} not found.`);
    this.name = "PresentationNotFoundError";
  }
}

// Milestone M9.
export class SlideNotFoundError extends Error {
  constructor(id, slideId) {
    super(`Slide ${slideId} not found on presentation ${id}.`);
    this.name = "SlideNotFoundError";
  }
}
/** Generic 400-class input validation failure (e.g. a bad reorder payload). */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnknownTemplateError extends Error {
  constructor(templateName) {
    super(`Unknown template "${templateName}".`);
    this.name = "UnknownTemplateError";
  }
}

/** Deleting the only remaining slide would leave a deck that can't be edited
 *  (the Editor requires at least one slide) or presented. */
export class LastSlideError extends Error {
  constructor(id) {
    super("A presentation must keep at least one slide.");
    this.name = "LastSlideError";
    this.presentationId = id;
  }
}

// Re-exported so the Application Layer maps this to a status code without
// needing to know slide-content.js exists.
export { SlideContentInvalidError };

// Slide content is out of scope for this endpoint — that's M9's
// PATCH .../slides/:slideId, a different endpoint entirely. Everything
// else is forwarded to the Repository as-is: it already enforces
// immutable-field rejection and status-transition validation correctly
// (proven in M2), and re-filtering fields here a second time only risks
// silently dropping an illegitimate change instead of rejecting it — see
// the M3 implementation report for the bug this caused and its fix.

/**
 * Workspace isolation, applied identically everywhere a single record is
 * read. A record belonging to another workspace is reported as not-found
 * rather than forbidden, so a caller cannot use error codes to discover
 * that an id exists in a workspace they cannot see.
 */
function assertVisible(record, context, id) {
  if (!record || record.workspaceId !== context.workspaceId) {
    throw new PresentationNotFoundError(id);
  }
  return record;
}

/** Per-presentation write serialization: every structural slide operation is
 * a read-modify-write of the whole slides array, and json-file-store's lock
 * only serializes the WRITE — two concurrent ops would still both read the
 * same starting array and the second write would silently drop the first's
 * change. All writers are this one Node process, so an in-process chain per
 * presentation id is a complete fix. */
const presentationLocks = new Map(); // id -> tail of the pending-ops chain
function withPresentationLock(id, fn) {
  const tail = presentationLocks.get(id) || Promise.resolve();
  const result = tail.then(fn);
  presentationLocks.set(id, result.then(() => {}, () => {}));
  return result;
}

class PresentationService {
  /**
   * @param {string} [status] - Phase 4 M15: lets GenerationService.
   *   approveGeneration() create an AI-authored presentation directly in
   *   "Generated" status instead of the repository's "Ready" default.
   *   Every other caller (manual creation, duplicate) omits this, so their
   *   behavior is unchanged — the repository still defaults to "Ready".
   */
  async createPresentation(context, { title, slides, description, footer, basedOnTemplatePackId, status, origin, layoutFallback }) {
    return presentationRepository.insert({
      title,
      description,
      // Workspace and owner come from the authenticated session, never
      // from the request body — a client cannot create a presentation in
      // someone else's workspace or attribute it to another user.
      workspaceId: context.workspaceId,
      ownerId: context.userId,
      basedOnTemplatePackId,
      footer,
      slides,
      status,
      // How the deck came to exist ("prompt" | "import") — the rail shows a
      // different marker per origin.
      origin,
      // { count, total } when some slides kept the default layout — shown on
      // the deck until it is re-composed, so a flat deck says why it is flat.
      layoutFallback: layoutFallback ?? null,
    });
  }

  async getPresentation(context, id) {
    const record = await presentationRepository.findById(id);
    return assertVisible(record, context, id);
  }

  /** Backs GET /api/presentations. Returns lightweight summaries (no full
   * slide content — Phase 2.5 §05 distinguishes "Presentation[] summary"
   * here from the full "Presentation + Slides" the single-record GET
   * returns) plus a total count for pagination. */
  async listPresentations(context, { status, archived, search, sort = "updatedAt", limit = 24, offset = 0 } = {}) {
    const workspaceId = context.workspaceId;
    let results = search
      ? await presentationRepository.search(workspaceId, search)
      : await presentationRepository.findByWorkspace(workspaceId);

    /* `archived` asks the question the Library actually has: active decks, or
     * put-away ones. It is deliberately NOT a status list.
     *
     * The Library used to request status="Ready" for its default view, which
     * silently hid every AI-generated deck the moment "Generated" was added as
     * a status — 7 of 9 presentations were invisible on a page whose own copy
     * promised "every presentation in your workspace". Any status added later
     * would have vanished the same way. Asking "not archived" cannot rot. */
    if (archived !== undefined) {
      results = results.filter((p) => (p.status === "Archived") === Boolean(archived));
    }
    if (status) results = results.filter((p) => p.status === status);

    results = [...results].sort((a, b) =>
      sort === "title" ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt)
    );

    const total = results.length;
    const page = results.slice(offset, offset + limit).map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      workspaceId: p.workspaceId,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
      origin: p.origin || "prompt",
      slideCount: p.slides.length,
    }));

    return { items: page, total };
  }

  /**
   * WP9: the minimum lightweight read ExportService.listExports needs to
   * resolve which Export Jobs belong to the caller's workspace and to
   * attach each Job's presentation title/updatedAt to its row. A thin
   * wrapper around the already-existing presentationRepository.
   * findByWorkspace — the same Storage-layer method listPresentations
   * itself already uses for its own workspace scoping — never a new
   * repository query. Deliberately unpaginated (unlike listPresentations):
   * ExportService needs the full membership set to filter Jobs against,
   * not one page of it, and deliberately excludes slide content (unlike
   * getPresentation) to stay lightweight for a call another Service makes
   * incidentally, not one a screen renders directly.
   */
  async listWorkspacePresentationSummaries(context) {
    const records = await presentationRepository.findByWorkspace(context.workspaceId);
    return records.map((p) => ({ id: p.id, title: p.title, updatedAt: p.updatedAt }));
  }

  async updatePresentation(context, id, changes = {}) {
    assertVisible(await presentationRepository.findById(id), context, id);

    const { slides: _ignoredSlides, ...patch } = changes;
    try {
      return await presentationRepository.update(id, patch);
    } catch (e) {
      if (/not found/i.test(e.message)) throw new PresentationNotFoundError(id);
      throw e;
    }
  }

  async duplicatePresentation(context, id) {
    const source = assertVisible(await presentationRepository.findById(id), context, id);

    return presentationRepository.insert({
      title: `${source.title} (copy)`,
      description: source.description,
      workspaceId: source.workspaceId,
      // The duplicate belongs to whoever made it, not to the original's
      // owner — otherwise a member could not manage a copy they created.
      ownerId: context.userId,
      basedOnTemplatePackId: source.basedOnTemplatePackId,
      footer: source.footer,
      origin: source.origin,
      slides: source.slides.map((s) => ({
        templateReference: s.templateReference,
        themeOverride: s.themeOverride,
        content: { ...s.content },
        manualOverrides: { ...s.manualOverrides },
        styleOverrides: { ...s.styleOverrides },
        order: s.order,
        ...(s.role ? { role: s.role } : {}),
      })),
    });
  }

  async archivePresentation(context, id, archived) {
    assertVisible(await presentationRepository.findById(id), context, id);
    try {
      return await presentationRepository.update(id, { status: archived ? "Archived" : "Ready" });
    } catch (e) {
      if (/not found/i.test(e.message)) throw new PresentationNotFoundError(id);
      throw e;
    }
  }

  async deletePresentation(context, id) {
    assertVisible(await presentationRepository.findById(id), context, id);
    const deleted = await presentationRepository.delete(id);
    if (!deleted) throw new PresentationNotFoundError(id);
    return true;
  }

  /**
   * The one function permitted to assemble the Rendering Engine's contract.
   * Storage-shape (templateReference.templateName, themeOverride, content)
   * → Engine-shape (flat template, theme, ...content fields), exactly as
   * proven by M2's disposable verification script — now permanent,
   * production code, correctly placed in the Domain layer.
   */
  async buildDeckDefinition(context, id) {
    const record = assertVisible(await presentationRepository.findById(id), context, id);

    return {
      meta: {
        id: record.id,
        title: record.title,
        description: record.description,
        footer: record.footer,
      },
      slides: record.slides
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          template: s.templateReference.templateName,
          theme: s.themeOverride,
          ...s.content,
          // The Rendering Engine applies these itself (js/style-overrides.js,
          // called from buildStage) — which is what makes Present mode and
          // the export show the same per-element edits as the Editor canvas.
          styleOverrides: s.styleOverrides || {},
        })),
    };
  }

  /**
   * PATCH .../slides/:slideId (Phase 2.5 §05) — direct, user-authored field
   * edits from the Editor. Always allows the write (allowOverride: true):
   * the Repository's manual-override conflict check exists to stop an
   * AUTOMATED process (template swap, and eventually AI regeneration) from
   * silently clobbering a manual edit — not to stop a user from editing
   * their own field a second time.
   *
   * @param {{content?: object, manualOverrides?: object}} patch - the
   *   caller (Editor) decides manualOverrides explicitly rather than this
   *   method always forcing it true, because undo/redo (approved decision
   *   H) must be able to restore a field to its pre-edit manualOverrides
   *   state too, which is sometimes false.
   */
  /**
   * Every content write goes through slide-content.js first: the patch is
   * coerced to the template's declared field types, merged over the slide's
   * current content, and then actually rendered. If that render throws the
   * write is refused and the existing, known-good content is left in place.
   *
   * This is the single choke point that makes the "blank slide" failure
   * impossible to persist — see slide-content.js for the full rationale. It
   * lives here rather than in any caller so that the editor, AI Assist, undo
   * and template swap are all covered by the same guarantee.
   */
  async updateSlide(context, id, slideId, { content, manualOverrides, styleOverrides, themeOverride } = {}) {
    const record = assertVisible(await presentationRepository.findById(id), context, id);
    const slide = record.slides.find((s) => s.id === slideId);
    if (!slide) {
      throw new SlideNotFoundError(id, slideId);
    }

    let nextContent = content;
    /* Fields the template does not declare are dropped by prepareContentUpdate.
     * That is correct — writing them would put unrenderable data on the slide —
     * but it used to happen in complete silence behind a 200, so an editor or
     * an AI action that named a field the current layout lacks got a success it
     * had not earned. The names travel back on the response now. */
    let droppedFields = [];
    if (content && typeof content === "object") {
      // Throws SlideContentInvalidError → surfaced as 422 by the route.
      const prepared = prepareContentUpdate(
        slide.templateReference?.templateName,
        slide.content || {},
        content
      );
      // Only the fields this patch actually touched are written, so an
      // unrelated concurrent edit to another field isn't clobbered by the
      // merged snapshot used for validation.
      nextContent = {};
      for (const field of Object.keys(content)) {
        if (field in prepared.content) nextContent[field] = prepared.content[field];
        else droppedFields.push(field);
      }
    }

    // Style is validated separately from content and by different rules: it
    // cannot make a slide fail to render (it is applied after rendering), but
    // it CAN take a slide off-brand, which is what slide-style.js refuses.
    // Throws SlideStyleInvalidError → surfaced as 422 by the route.
    const nextStyle = styleOverrides === undefined ? undefined : sanitizeStyleOverrides(styleOverrides);

    /* themeOverride was not in the destructure at all, so a PATCH carrying it
     * was answered 200 with the slide unchanged — the repository has always
     * supported the field, and nothing between here and it passed it on. The
     * effect was that a slide's light/dark could not be changed by any means:
     * not by the API, and so not by anything built on it. Silent, because the
     * response was a valid slide and the caller had no way to tell it had been
     * ignored. Rejected loudly now when it is not one of the two themes. */
    let nextTheme;
    if (themeOverride !== undefined) {
      if (themeOverride !== null && themeOverride !== "light" && themeOverride !== "dark") {
        /* (message, {field, reason}) — not (slideId, message). Passing the id
         * first made the 422 body read `"error":"<uuid>"`, which tells the
         * caller nothing about what it got wrong. */
        throw new SlideContentInvalidError(
          `themeOverride must be "light", "dark" or null — got ${JSON.stringify(themeOverride)}.`,
          { field: "themeOverride", reason: "unsupported-value" });
      }
      nextTheme = themeOverride === null ? undefined : themeOverride;
      if (themeOverride === null) nextTheme = "light";
    }

    const updated = await presentationRepository.update(
      id,
      {
        slides: [{
          id: slideId,
          content: nextContent,
          manualOverrides,
          styleOverrides: nextStyle,
          themeOverride: nextTheme,
          lastEditedBy: context.userId,
        }],
      },
      { allowOverride: true }
    );
    const slideOut = updated.slides.find((s) => s.id === slideId);
    // Only when something was actually discarded, so the ordinary response
    // shape is unchanged for every caller that patches valid fields.
    return droppedFields.length ? { ...slideOut, droppedFields } : slideOut;
  }

  /* ---- Slide structure: add / duplicate / delete --------------------------
   * The Editor had no way to change a deck's slide COUNT — only to edit the
   * slides it already had. These three methods add that, all sharing the
   * repository's replaceSlides path and all re-deriving `order` from array
   * position so it can never drift out of sync with the real sequence. */

  /**
   * @param {{templateName: string, position?: "before"|"after"|"end",
   *          relativeToSlideId?: string, content?: object}} params
   *   `content`, when given, replaces the template's own example content —
   *   this is what lets addSlide() double as the landing point for AI-
   *   authored slides (see generateSlide()) without a second insert path.
   *   It is still coerced and render-checked exactly like any other write,
   *   so an AI-authored slide can no more be blank than a hand-made one.
   */
  async addSlide(context, id, { templateName, position = "end", relativeToSlideId, content: providedContent } = {}) {
    return withPresentationLock(id, async () => {
      const record = assertVisible(await presentationRepository.findById(id), context, id);
  
      const template = allTemplates.find((t) => t.name === templateName);
      if (!template) throw new UnknownTemplateError(templateName);
  
      // A new slide starts from the template's own example content — the same
      // starting point M5 gives a slide created with a new presentation — so
      // it renders immediately instead of appearing blank. When content IS
      // supplied, it is coerced against the template's own schema first
      // (prepareContentUpdate merges it over an empty base — i.e. any field
      // the caller omitted still falls back to the template's example, so a
      // partial AI response can never leave a field genuinely blank).
      const content = providedContent
        ? prepareContentUpdate(template.name, template.example || {}, providedContent).content
        : { ...(template.example || {}) };
      assertRenders(template.name, content);
  
      const newSlide = {
        templateReference: { templateName: template.name, templateVersion: 1, templatePackId: "main-template" },
        themeOverride: template.theme,
        content,
        manualOverrides: {},
        lastEditedBy: context.userId,
      };
  
      const slides = [...record.slides];
      let insertAt = slides.length;
      if (position !== "end" && relativeToSlideId) {
        const refIndex = slides.findIndex((s) => s.id === relativeToSlideId);
        if (refIndex === -1) throw new SlideNotFoundError(id, relativeToSlideId);
        insertAt = position === "before" ? refIndex : refIndex + 1;
      }
      slides.splice(insertAt, 0, newSlide);
  
      const updated = await presentationRepository.update(id, { slides }, { replaceSlides: true });
      return { presentation: updated, slide: updated.slides[insertAt], index: insertAt };
    });
  }

  /** Copies content AND template — a duplicate is a genuine independent copy. */
  async duplicateSlide(context, id, slideId) {
    return withPresentationLock(id, async () => {
      const record = assertVisible(await presentationRepository.findById(id), context, id);
      const index = record.slides.findIndex((s) => s.id === slideId);
      if (index === -1) throw new SlideNotFoundError(id, slideId);
  
      const source = record.slides[index];
      const copy = {
        templateReference: { ...source.templateReference },
        themeOverride: source.themeOverride,
        content: structuredClone(source.content || {}),
        manualOverrides: structuredClone(source.manualOverrides || {}),
        lastEditedBy: context.userId,
      };
  
      const slides = [...record.slides];
      slides.splice(index + 1, 0, copy);
  
      const updated = await presentationRepository.update(id, { slides }, { replaceSlides: true });
      return { presentation: updated, slide: updated.slides[index + 1], index: index + 1 };
    });
  }

  /** Refuses to remove the last slide: a deck with zero slides can neither be
   *  edited (the Editor requires one) nor presented. */
  async deleteSlide(context, id, slideId) {
    return withPresentationLock(id, async () => {
      const record = assertVisible(await presentationRepository.findById(id), context, id);
      if (!record.slides.some((s) => s.id === slideId)) {
        throw new SlideNotFoundError(id, slideId);
      }
      if (record.slides.length <= 1) {
        throw new LastSlideError(id);
      }
      const slides = record.slides.filter((s) => s.id !== slideId);
      return presentationRepository.update(id, { slides }, { replaceSlides: true });
    });
  }

  /**
   * Reorders slides to a new sequence of ids — the drag-to-reorder gesture in
   * the navigator. `order` is re-derived from array position by the same
   * replaceSlides path add/duplicate/delete already use, so it can never
   * drift out of sync with the real order.
   *
   * @param {string[]} slideIds - every slide id, in its new order
   */
  async reorderSlides(context, id, slideIds) {
    return withPresentationLock(id, async () => {
      const record = assertVisible(await presentationRepository.findById(id), context, id);
      const byId = new Map(record.slides.map((s) => [s.id, s]));
  
      if (
        !Array.isArray(slideIds) ||
        slideIds.length !== record.slides.length ||
        new Set(slideIds).size !== slideIds.length ||
        !slideIds.every((sid) => byId.has(sid))
      ) {
        throw new ValidationError("slideIds must be a permutation of the presentation's current slide ids.");
      }
  
      const slides = slideIds.map((sid) => byId.get(sid));
      return presentationRepository.update(id, { slides }, { replaceSlides: true });
    });
  }

  /**
   * POST .../slides/:slideId/template (Phase 2.5 §05). Approved decision C:
   * the manual-override conflict trigger in M9, since no AI regeneration
   * exists yet to trigger it the way Phase 3 §07 originally frames it.
   * Approved decision G: fields present in both the old content and the new
   * template's schema carry their value over unchanged — unless the two
   * schemas declare that field a different *kind* (e.g. one template's
   * "columns" is a fixed string[3], another's is an array of {title,
   * items[]} objects); a same-named-but-differently-shaped field is treated
   * as unmapped rather than handed to a render() that expects the other
   * shape. Fields with no equivalent (by name, or now by compatible kind) in
   * the new schema are dropped from content — never silently, the caller is
   * told exactly which via `unmappedFields` — and fields the new schema adds
   * fall back to that template's own example content, exactly as a
   * brand-new slide would be created (M5).
   */
  async swapSlideTemplate(context, id, slideId, { templateName, allowOverride = false } = {}) {
    return withPresentationLock(id, async () => {
      const record = assertVisible(await presentationRepository.findById(id), context, id);
      const slide = record.slides.find((s) => s.id === slideId);
      if (!slide) throw new SlideNotFoundError(id, slideId);
  
      const target = allTemplates.find((t) => t.name === templateName);
      if (!target) throw new UnknownTemplateError(templateName);
      const source = allTemplates.find((t) => t.name === slide.templateReference?.templateName);

      const schemaFields = Object.keys(target.schema || {});
      const oldContent = slide.content || {};
      const oldOverrides = slide.manualOverrides || {};

      const content = {};
      const unmappedFields = [];
      const conflictFields = [];

      for (const field of Object.keys(oldContent)) {
        // Same name is not enough: two templates can both call a field
        // "columns" while meaning different shapes (comparison-table's fixed
        // string[3] of header labels vs. slide-41's array of {heading, desc,
        // bullets[], ...} phase objects). Carrying it over by name alone
        // handed the new template's render() a value shaped for the OLD
        // one — assertRenders() below then rejects the whole swap with a
        // raw render error, which is exactly the "no clear next step" crash
        // this guards against. When the old field's kind is known and
        // disagrees with the new one, treat it as unmapped instead, so it
        // falls through to the target's own default below.
        const oldKind = source?.schema?.[field] !== undefined ? fieldKind(source.schema[field]) : null;
        const kindMismatch = oldKind !== null && schemaFields.includes(field) && oldKind !== fieldKind(target.schema[field]);
        if (schemaFields.includes(field) && !kindMismatch) {
          content[field] = oldContent[field];
          if (oldOverrides[field]) conflictFields.push(field);
        } else {
          unmappedFields.push(field);
        }
      }
      for (const field of schemaFields) {
        if (!(field in content)) content[field] = target.example?.[field] ?? "";
      }
  
      if (conflictFields.length > 0 && !allowOverride) {
        throw new ManualOverrideConflictError(slideId, conflictFields[0]);
      }
  
      // A carried-over value can be the right type for the OLD template and the
      // wrong one for the new (e.g. a `string` heading landing on a field the
      // new template reads as `string[]`). Without this, a swap could persist
      // exactly the unrenderable state slide-content.js exists to prevent.
      assertRenders(target.name, content);
  
      const updated = await presentationRepository.update(
        id,
        {
          slides: [{
            id: slideId,
            templateReference: { templateName: target.name, templateVersion: 1, templatePackId: "main-template" },
            /* The SLIDE's theme, not the new template's default.
             *
             * A slide is dark because of where it sits in the deck — the brand
             * opens and closes dark — or because someone chose it. The template
             * only declares what it renders as when nothing else says. Taking
             * the target's default turned a dark cover light the moment the AI
             * panel swapped its layout: the deck's opening lost the sandwich,
             * silently, as a side effect of an unrelated change. Falls back to
             * the target's own theme only when the slide never had one. */
            themeOverride: slide.themeOverride ?? target.theme,
            content,
            // Replace, not merge: fields that don't map onto the new
            // template (collected above as unmappedFields) must actually
            // disappear from storage, not linger orphaned in slide.content.
            replaceContent: true,
            // Per-element styling is dropped on a template swap: an override
            // says "this element, one step larger than THIS template made it",
            // and the new template lays its elements out differently — keeping
            // them would apply sizes and offsets to text that has moved.
            styleOverrides: {},
            lastEditedBy: context.userId,
          }],
        },
        { allowOverride: true } // this Service already gated the conflict check above
      );
  
      return { slide: updated.slides.find((s) => s.id === slideId), unmappedFields };
    });
  }
}

export const presentationService = new PresentationService();
