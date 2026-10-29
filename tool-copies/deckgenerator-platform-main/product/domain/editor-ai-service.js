// =============================================================================
// Editor AI Service — M15 Phase 3, Domain Layer.
//
// Lightweight AI assistance for a single slide's content: improve, rewrite,
// or suggest — never a full presentation generation. Deliberately has no
// Repository and creates no persisted record for any of these actions (per
// the explicit persistence decision for this phase): a request runs
// synchronously and its result is returned directly to the caller, never
// stored. Reuses PresentationService for workspace visibility and slide
// existence, exactly the same way every other slide-mutation flow in this
// codebase already does — no new isolation logic invented here.
//
// Depends only on the AIProvider contract (infrastructure/ai/ai-provider.js),
// via constructor injection — the same pattern GenerationService already
// establishes, and for the identical reason: this file must never import a
// concrete provider implementation.
// =============================================================================
import { presentationService, SlideNotFoundError, UnknownTemplateError } from "./presentation-service.js";
import { schemaKinds, fieldKind, findTemplate } from "./slide-content.js";
import { liveTemplates } from "./live-templates.js";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The real brand photography on disk. Handing the model actual paths is
 *  what makes "add an image" produce a picture instead of a broken URL. */
let cachedImages = null;
function listBrandImages(limit = 24) {
  if (cachedImages) return cachedImages;
  try {
    cachedImages = readdirSync(join(REPO_ROOT, "assets", "photography"))
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .slice(0, limit)
      .map((f) => `assets/photography/${f}`);
  } catch {
    cachedImages = [];
  }
  return cachedImages;
}

export class EditorAiValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EditorAiValidationError";
  }
}

/**
 * The actions the product offers. Deliberately declared here in the Domain
 * rather than imported from a provider: which editing operations exist is a
 * product decision, and this Service must never import a concrete provider
 * (the same constraint that keeps `provider` constructor-injected). A
 * provider is free to reject any of these, but cannot invent new ones.
 *
 * "advice" actions return suggestions only and never rewrite the slide;
 * every other action returns replacement content for existing fields.
 */
export const ASSIST_ACTIONS = [
  "improve", "rewrite", "concise", "expand", "shorten", "simplify",
  "executive", "professional", "persuasive", "technical", "grammar",
  "storytelling", "toBullets", "toParagraphs",
  "suggest", "speakerNotes", "imageIdeas", "followUpSlides",
];
const VALID_ACTIONS = ASSIST_ACTIONS;

/**
 * Builds the "Standing instructions from the author" block from a deck's
 * aiMemory, pinned facts first, capped at 12 entries — Phase 3 §3. Returns
 * "" (skip entirely) when there's nothing to say.
 */
function standingInstructionsBlock(aiMemory) {
  if (!Array.isArray(aiMemory) || !aiMemory.length) return "";
  const ordered = [...aiMemory]
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    .slice(0, 12);
  if (!ordered.length) return "";
  const lines = ordered.map((e) => `- ${e.text}`).join("\n");
  return `Standing instructions from the author (follow unless the current ask overrides them):\n${lines}`;
}

export class EditorAiService {
  /** @param {import("../infrastructure/ai/ai-provider.js").AIProvider} provider */
  constructor(provider) {
    if (!provider) throw new Error("EditorAiService requires an AIProvider.");
    this.provider = provider;
  }

  /**
   * Backs POST /api/presentations/:id/slides/:slideId/ai.
   *
   * @param {{userId, workspaceId, role}} context
   * @param {string} presentationId
   * @param {string} slideId
   * @param {{action: string, content: object, instructions?: string}} params
   */
  async assist(context, presentationId, slideId, { action, content, instructions, history } = {}) {
    if (!VALID_ACTIONS.includes(action)) {
      throw new EditorAiValidationError(`action must be one of: ${VALID_ACTIONS.join(", ")}.`);
    }
    if (!content || typeof content !== "object" || Array.isArray(content)) {
      throw new EditorAiValidationError("content is required.");
    }

    // Workspace visibility (throws PresentationNotFoundError if the
    // presentation doesn't exist or isn't visible to this context) and
    // slide existence — the same two checks
    // PresentationService.updateSlide/swapSlideTemplate already perform for
    // every other slide-mutation endpoint.
    const presentation = await presentationService.getPresentation(context, presentationId);
    const slide = presentation.slides.find((s) => s.id === slideId);
    if (!slide) {
      throw new SlideNotFoundError(presentationId, slideId);
    }

    // The provider is told each field's REQUIRED type, straight from the
    // slide's own template schema. Without this it can only guess from the
    // sample value — and a field that happens to hold one bullet today looks
    // identical to a plain string, which is exactly how a `string[]` field
    // ends up rewritten as prose and the slide stops rendering.
    const kinds = schemaKinds(slide.templateReference?.templateName);
    const fieldTypes = {};
    for (const field of Object.keys(content)) {
      fieldTypes[field] =
        kinds[field] === "stringArray" ? "string[]"
        : kinds[field] === "objectArray" ? "object[]"
        : "string";
    }

    // History is advisory context, sanitized hard: role/text pairs only,
    // capped so a long session can never balloon the prompt.
    const cleanHistory = Array.isArray(history)
      ? history
          .filter((h) => h && typeof h.text === "string" && h.text.trim())
          .slice(-10)
          .map((h) => ({ role: h.role === "assistant" ? "assistant" : "user", text: String(h.text).slice(0, 300) }))
      : [];

    const memoryBlock = standingInstructionsBlock(presentation.aiMemory);
    const mergedInstructions = memoryBlock
      ? `${memoryBlock}\n\n${instructions || ""}`.trim()
      : instructions;

    return this.provider.assistEditor({ action, content, instructions: mergedInstructions, fieldTypes, history: cleanHistory });
  }

  /**
   * Backs POST /api/presentations/:id/slides/:slideId/plan.
   *
   * The assist path can only rewrite the words of the template already in
   * use. This one lets one natural-language ask change the SHAPE of the
   * slide — swap to a layout that fits better, or add a companion slide —
   * by giving the model the real template catalog and the real image assets
   * on disk. Every operation it can return maps onto an engine capability
   * that already exists, so nothing new can be invented into the deck.
   */
  async planSlideChange(context, presentationId, slideId, { instruction } = {}) {
    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      throw new EditorAiValidationError("instruction is required.");
    }
    const presentation = await presentationService.getPresentation(context, presentationId);
    const slide = presentation.slides.find((s) => s.id === slideId);
    if (!slide) throw new SlideNotFoundError(presentationId, slideId);

    const templates = liveTemplates.map((t) => ({
      name: t.name,
      description: t.description || "",
      schema: t.schema || {},
    }));

    const memoryBlock = standingInstructionsBlock(presentation.aiMemory);
    const mergedInstruction = memoryBlock ? `${memoryBlock}\n\n${instruction.trim()}` : instruction.trim();

    return this.provider.planSlideChange({
      instruction: mergedInstruction,
      templateName: slide.templateReference?.templateName,
      content: slide.content,
      templates,
      images: listBrandImages(),
    });
  }

  /** Backs POST /api/presentations/:id/review — whole-deck analysis. */
  async reviewPresentation(context, presentationId) {
    const presentation = await presentationService.getPresentation(context, presentationId);
    const slides = presentation.slides.map((s) => ({
      templateName: s.templateReference?.templateName || "",
      content: s.content || {},
    }));
    if (!slides.length) throw new EditorAiValidationError("This presentation has no slides to review.");
    return this.provider.reviewPresentation({ slides });
  }

  /**
   * Backs POST /api/presentations/:id/slides/generate — "Generate slide with
   * AI." The user states intent only; Claude picks the template (from every
   * real one in the library) and drafts its content, then the slide is
   * inserted through the exact same presentationService.addSlide() every
   * other slide-creation path already uses, so it is coerced and render-
   * checked identically — an AI-authored slide can no more be blank than a
   * hand-made one.
   */
  async generateSlide(context, presentationId, { intent, position, relativeToSlideId } = {}) {
    if (!intent || typeof intent !== "string" || !intent.trim()) {
      throw new EditorAiValidationError("intent is required.");
    }
    // Visibility check — same reason as assist() above.
    await presentationService.getPresentation(context, presentationId);

    const templates = liveTemplates.map((t) => ({ name: t.name, schema: t.schema || {} }));
    const result = await this.provider.generateSlide({ intent: intent.trim(), templates });

    return presentationService.addSlide(context, presentationId, {
      templateName: result.templateName,
      position,
      relativeToSlideId,
      content: result.content,
    });
  }

  /**
   * Backs POST /api/presentations/:id/slides/:slideId/map-template — a
   * semantic suggestion for template swap's field-mapping dialog. Runs
   * ONLY when the deterministic exact-name/same-kind heuristic (still the
   * first pass, in presentation-service's swap flow) wasn't fully
   * confident — this is what lets a genuinely different field ("Subtitle"
   * → "Executive Summary") get suggested instead of left blank.
   */
  async suggestFieldMapping(context, presentationId, slideId, { newTemplateName } = {}) {
    const presentation = await presentationService.getPresentation(context, presentationId);
    const slide = presentation.slides.find((s) => s.id === slideId);
    if (!slide) throw new SlideNotFoundError(presentationId, slideId);

    const newTemplate = findTemplate(newTemplateName);
    if (!newTemplate) throw new UnknownTemplateError(newTemplateName);

    const oldSchema = findTemplate(slide.templateReference?.templateName)?.schema || {};
    const describeFields = (schema, content) =>
      Object.entries(schema).map(([key, description]) => ({
        key, kind: fieldKind(description),
        value: content ? content[key] : undefined,
      }));

    const oldFields = describeFields(oldSchema, slide.content);
    const newFields = describeFields(newTemplate.schema || {});

    return this.provider.suggestFieldMapping({ oldFields, newFields });
  }
}
