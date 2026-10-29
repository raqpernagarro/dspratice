// =============================================================================
// AI Provider contract — M15, Infrastructure Layer.
//
// The one interface Generation Service is allowed to know about. No provider
// implementation (mock, Claude Code, Anthropic API, or anything else) is
// imported here, and this file makes no network calls and has no external
// dependencies beyond the pure, in-repo js/brief-check.js — it exists only to
// define the shape every provider must implement, so a future real provider
// swaps in behind this contract without any change to Domain code.
// =============================================================================

import { fallbackQuestions } from "../../../js/brief-check.js";

/**
 * @typedef {Object} GenerationRequest
 * @property {string} prompt
 */

/**
 * @typedef {Object} ProposedSlide
 * @property {number} slideNumber
 * @property {string} title
 * @property {{title: string, body: string}} content - placeholder content for the slide
 */

/**
 * @typedef {Object} CoachRequest
 * @property {string} prompt - the brief as typed
 * @property {string[]} ask - dimensions to ask about (from js/brief-check.js)
 * @property {string[]} [optional] - dimensions the model MAY ask about if the
 *   topic needs them (today only "figures")
 * @property {number} [timeoutMs]
 */

/**
 * @typedef {Object} CoachQuestion
 * @property {"audience"|"goal"|"points"|"figures"|"length"} dimension
 * @property {string} question
 * @property {string} placeholder
 */

/**
 * @typedef {Object} GenerationUsage
 * @property {number} inputTokens
 * @property {number} outputTokens
 * @property {number} costUsd
 */

/**
 * @typedef {Object} GenerationResult
 * @property {string} title
 * @property {number} slideCount
 * @property {ProposedSlide[]} proposedMapping
 * @property {Object<string, number>} confidencePerSlide - keyed by slideNumber as a string
 * @property {GenerationUsage} usage
 */

/**
 * @typedef {Object} EditorAssistRequest
 * @property {"improve"|"rewrite"|"suggest"} action
 * @property {Object<string, string|string[]>} content - the slide's current
 *   editable field values (string or string[] per field), keyed by field name
 * @property {string} [instructions] - optional free-text guidance (e.g. a
 *   requested tone), only meaningful for "rewrite"
 */

/**
 * @typedef {Object} EditorAssistResult
 * @property {"improve"|"rewrite"|"suggest"} action
 * @property {Object<string, string|string[]>|null} content - present for
 *   "improve"/"rewrite"; null for "suggest"
 * @property {string[]|null} suggestions - present for "suggest" and
 *   optionally "improve"; null for "rewrite"
 * @property {GenerationUsage} usage
 */

/**
 * @typedef {Object} SlideGenerationRequest
 * @property {string} intent - what the user said the slide should communicate
 * @property {{name: string, schema: object}[]} templates - every template the
 *   provider may choose from (name + field schema only — no example content,
 *   to keep the prompt focused on what each template is FOR)
 */

/**
 * @typedef {Object} SlideGenerationResult
 * @property {string} templateName - must be one of the names offered
 * @property {Object<string, string|string[]>} content - keyed by that
 *   template's own schema fields
 * @property {GenerationUsage} usage
 */

/**
 * Base contract for every AI provider. A concrete provider extends this and
 * implements every method below; calling a base implementation directly is
 * always a programming error, not a valid provider. All three methods exist
 * on this one contract deliberately — Editor AI Assist and AI-driven slide
 * creation reuse the same abstraction rather than introducing a second one.
 */
/**
 * A failure of the AI backend itself, as opposed to a bad request.
 *
 * The provider already writes messages a person can act on — "The Claude CLI
 * isn't installed on this machine… install it from claude.com/claude-code",
 * "The AI took too long to respond" — but they were plain Errors, so the
 * application layer had no way to tell them from an internal fault and
 * answered every one with a generic 500 "Could not run the AI assist action."
 * The one useful sentence was written, then discarded one layer from the user.
 *
 * Typed here, on the contract rather than in the CLI implementation, so any
 * future provider maps to the same response without the routes learning
 * anything about which backend is in use.
 */
export class AiProviderError extends Error {
  /** @param {string} message - shown to the user verbatim; say what to do. */
  constructor(message, { retryable = false } = {}) {
    super(message);
    this.name = "AiProviderError";
    this.retryable = retryable;
  }
}

export class AIProvider {
  /**
   * @param {GenerationRequest} request
   * @returns {Promise<GenerationResult>}
   */
  async generatePresentation(request) {
    throw new Error("AIProvider.generatePresentation() must be implemented by a subclass.");
  }

  /**
   * @param {EditorAssistRequest} request
   * @returns {Promise<EditorAssistResult>}
   */
  async assistEditor(request) {
    throw new Error("AIProvider.assistEditor() must be implemented by a subclass.");
  }

  /**
   * Chooses the best-fitting template for one new slide and drafts its
   * content — the "Generate slide with AI" flow, where the user states
   * intent only and never picks a template themselves.
   * @param {SlideGenerationRequest} request
   * @returns {Promise<SlideGenerationResult>}
   */
  async generateSlide(request) {
    throw new Error("AIProvider.generateSlide() must be implemented by a subclass.");
  }

  /**
   * Follow-up questions for a thin brief — the prompt coach. Unlike the
   * methods above this has a working default: a provider that cannot ask
   * still gets the fixed questions, flagged `fallback` so the caller reports
   * source "fallback". The coach must never be the reason Generate fails.
   * @param {CoachRequest} request
   * @returns {Promise<{questions: CoachQuestion[], fallback?: true}>}
   */
  async coachBrief({ ask = [] } = {}) {
    return { questions: fallbackQuestions(ask), fallback: true };
  }

  /* ---- Intelligence layer: understand → story → (outline) → voice --------
   * Each step is optional. A provider that cannot run one resolves null and
   * the pipeline carries on exactly as before, without that step. A provider
   * that can run it may still reject (timeout, session limit); the caller
   * catches and records a note, never failing the deck. */

  /**
   * Reads the prompt, coach answers and reference text and returns the
   * content brief. `proof` holds only facts present in that material.
   * @param {{prompt: string, answers?: Object<string,string>, references?: {id: string, name: string, text: string}[]}} request
   * @returns {Promise<ContentBrief|null>}
   */
  async understandContent(request) {
    return null;
  }

  /**
   * Shapes the brief into an arc of beats, an optional hook and a callback.
   * @param {{brief: ContentBrief, wantsHook: boolean, slideCount?: number|null}} request
   * @returns {Promise<Story|null>}
   */
  async planStory(request) {
    return null;
  }

  /**
   * Rewrites the words of each slide to the Nagarro voice and the register,
   * keeping fields, structure, facts and per-field length budgets.
   * @param {{register: Tone, slides: {index: number, templateName: string, content: Object, budget: Object<string, number>}[]}} request
   * @returns {Promise<{slides: {index: number, content: Object}[]}|null>}
   */
  async editVoice(request) {
    return null;
  }

  /**
   * Describes an image attached as a reference: what it shows, and every
   * legible piece of text and every figure in it, as plain text. A provider
   * that cannot read images resolves null; the image is still kept and can
   * still be placed on slides.
   * @param {{path: string}} request - absolute path of the stored image
   * @returns {Promise<string|null>}
   */
  async describeImage(request) {
    return null;
  }
}

/**
 * @typedef {"thought"|"board"|"client"|"people"} Tone
 */

/**
 * @typedef {Object} ContentBrief
 * @property {string} coreIdea
 * @property {{who: string, tension: string, wants: string}} audience
 * @property {Tone} register
 * @property {{point: string, soWhat: string}[]} insights
 * @property {{fact: string, source: string}[]} proof - source is "prompt", "answer" or a reference id
 * @property {string[]} implications
 * @property {string[]} objections
 * @property {string[]} gaps
 * @property {{text: string, source: string}[]} moments
 */

/**
 * @typedef {Object} Story
 * @property {{kind: "moment"|"number"|"question"|"paradox"|"scene", text: string, framing: string}|null} hook
 * @property {{beat: "tension"|"why-now"|"change"|"proof"|"ask", titles: string[]}[]} arc
 * @property {string} callback
 */
