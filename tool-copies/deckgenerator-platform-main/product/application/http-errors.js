// =============================================================================
// Shared HTTP error mapping — one place that turns thrown errors into
// { error, code } responses. Before this, every route file kept its own
// sendError and its own (diverging) class → status decisions, two of them
// regex-matching err.message. Routes now call:
//
//   catch (err) { respondWithError(res, err, "Could not …"); }
//
// The `code` field is additive — existing clients read only `error`.
// =============================================================================
import {
  PresentationNotFoundError,
  SlideNotFoundError,
  UnknownTemplateError,
  LastSlideError,
  SlideContentInvalidError,
  SlideStyleInvalidError,
  ValidationError,
} from "../domain/presentation-service.js";
import { AiProviderError } from "../infrastructure/ai/ai-provider.js";
import {
  InvalidStatusTransitionError,
  ManualOverrideConflictError,
  AiMemoryValidationError,
  UnknownTemplateReferenceError,
} from "../storage/presentation-repository.js";

export function sendError(res, status, message, code) {
  res.status(status).json(code ? { error: message, code } : { error: message });
}

/** Ordered class → { status, code } map. First match wins. */
const CLASS_MAP = [
  [PresentationNotFoundError, { status: 404, code: "not_found" }],
  [SlideNotFoundError, { status: 404, code: "slide_not_found" }],
  [UnknownTemplateError, { status: 400, code: "unknown_template" }],
  // 409: a valid request that conflicts with the deck's current state.
  [LastSlideError, { status: 409, code: "last_slide" }],
  [SlideContentInvalidError, { status: 422, code: "invalid_content" }],
  [SlideStyleInvalidError, { status: 422, code: "invalid_style" }],
  [InvalidStatusTransitionError, { status: 400, code: "invalid_transition" }],
  [ManualOverrideConflictError, { status: 409, code: "override_conflict" }],
  [AiMemoryValidationError, { status: 422, code: "invalid_ai_memory" }],
  [UnknownTemplateReferenceError, { status: 400, code: "unknown_template" }],
  [ValidationError, { status: 400, code: "validation" }],
  /* 502: the request was fine, the AI backend was not. Its message is written
   * for the user and says what to do about it, so it is passed through rather
   * than replaced with a generic failure. */
  [AiProviderError, { status: 502, code: "ai_unavailable" }],
];

/** Fallback patterns for the storage layer's plain-Error validation throws
 * ("… is required.", "… is immutable …", "… not found."). Centralized here
 * so no route file regex-matches messages on its own. */
const MESSAGE_MAP = [
  [/is immutable/i, { status: 400, code: "immutable_field" }],
  [/is required\.?$/i, { status: 400, code: "validation" }],
  [/must be/i, { status: 400, code: "validation" }],
  [/not found\.?$/i, { status: 404, code: "not_found" }],
];

/** @returns {{status: number, code: string}|null} */
export function classifyError(err) {
  for (const [Cls, verdict] of CLASS_MAP) {
    if (err instanceof Cls) return verdict;
  }
  const message = err?.message || "";
  for (const [re, verdict] of MESSAGE_MAP) {
    if (re.test(message)) return verdict;
  }
  return null;
}

/**
 * Sends the mapped response for a recognized error, or a 500 with
 * `fallbackMessage` (never the raw internal message) otherwise.
 * `overrides` lets a route re-map a class for its own context — e.g. the
 * AI slide-generation route treats UnknownTemplateError as a 502, because
 * there the bad template name came from the model, not the caller.
 */
export function respondWithError(res, err, fallbackMessage, overrides = []) {
  for (const [Cls, verdict] of overrides) {
    if (err instanceof Cls) return sendError(res, verdict.status, err.message, verdict.code);
  }
  const verdict = classifyError(err);
  if (verdict) return sendError(res, verdict.status, err.message, verdict.code);
  console.error("Unmapped route error:", err);
  sendError(res, 500, fallbackMessage, "server_error");
}
