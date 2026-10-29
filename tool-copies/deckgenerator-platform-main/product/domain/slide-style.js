// =============================================================================
// Slide style overrides — Domain rules for the visual editor.
//
// Sits beside slide-content.js and exists for the same reason: the Storage
// layer must never be handed a shape nobody validated. Content has its own
// rules (it must RENDER); style has different ones (it must stay inside the
// brand system), so it gets its own module rather than being smuggled into
// slide-content.js.
//
// WHAT IS ALLOWED is deliberately narrow, and that narrowness is the point:
//   · sizes are RELATIVE to whatever the template chose (1 = unchanged), so
//     a slide can never be styled into a size that ignores the template's
//     own hierarchy;
//   · weights are only the five real Equip weights;
//   · colors are brand TOKEN NAMES, never arbitrary hex — a user cannot
//     introduce an off-brand color through the editor;
//   · movement is bounded to the 1920×1080 stage.
//
// The vocabulary itself is shared with the renderer (js/style-overrides.js),
// which is what applies these to a rendered slide. This module only decides
// what may be STORED.
// =============================================================================
import { COLOR_TOKENS, WEIGHTS, MIN_SIZE, MAX_SIZE, MIN_WIDTH, MAX_WIDTH } from "../../js/style-overrides.js";

const ALIGNMENTS = new Set(["left", "center", "right"]);
const MAX_OFFSET = 1920; // no override may push content further than the stage is wide
const MAX_TARGETS = 400; // a slide has far fewer editable leaves than this

export class SlideStyleInvalidError extends Error {
  constructor(message) {
    super(message);
    this.name = "SlideStyleInvalidError";
  }
}

/** A target key is "field", "field[3]", or "field[3].subKey" — anything else
 *  is not something the renderer could ever resolve, so it is refused rather
 *  than stored as dead weight. */
const KEY_PATTERN = /^[A-Za-z_][\w-]*(\[\d+\](\.[A-Za-z_][\w-]*)?)?$/;

/**
 * Returns a clean, storable copy of a styleOverrides map. Unknown properties
 * are dropped silently (a newer client sending a property this version does
 * not understand must not fail the whole write); malformed VALUES for known
 * properties are an error, because they would mean the caller is confused
 * about the contract rather than merely ahead of it.
 *
 * An entry that ends up with no properties at all is dropped entirely — that
 * is how "reset this element to the template" is expressed by the editor.
 *
 * @param {object} overrides
 * @returns {object} sanitized map, safe to persist
 */
export function sanitizeStyleOverrides(overrides) {
  if (overrides === undefined || overrides === null) return {};
  if (typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new SlideStyleInvalidError("styleOverrides must be an object.");
  }

  const entries = Object.entries(overrides);
  if (entries.length > MAX_TARGETS) {
    throw new SlideStyleInvalidError(`styleOverrides may not cover more than ${MAX_TARGETS} elements.`);
  }

  const out = {};
  for (const [key, style] of entries) {
    if (!KEY_PATTERN.test(key)) {
      throw new SlideStyleInvalidError(`"${key}" is not a valid style target.`);
    }
    if (style === null || style === undefined) continue; // an explicit clear
    if (typeof style !== "object" || Array.isArray(style)) {
      throw new SlideStyleInvalidError(`Style for "${key}" must be an object.`);
    }

    const clean = {};
    if (style.size !== undefined) {
      const size = Number(style.size);
      if (!Number.isFinite(size) || size < MIN_SIZE || size > MAX_SIZE) {
        throw new SlideStyleInvalidError(`Style size for "${key}" must be between ${MIN_SIZE} and ${MAX_SIZE}.`);
      }
      if (size !== 1) clean.size = round(size, 3);
    }
    if (style.weight !== undefined) {
      const weight = Number(style.weight);
      if (!WEIGHTS.includes(weight)) {
        throw new SlideStyleInvalidError(`Style weight for "${key}" must be one of: ${WEIGHTS.join(", ")}.`);
      }
      clean.weight = weight;
    }
    if (style.italic !== undefined) {
      if (typeof style.italic !== "boolean") {
        throw new SlideStyleInvalidError(`Style italic for "${key}" must be true or false.`);
      }
      if (style.italic) clean.italic = true;
    }
    if (style.color !== undefined && style.color !== null && style.color !== "") {
      if (!Object.prototype.hasOwnProperty.call(COLOR_TOKENS, style.color)) {
        throw new SlideStyleInvalidError(
          `Style color for "${key}" must be a brand token: ${Object.keys(COLOR_TOKENS).join(", ")}.`
        );
      }
      clean.color = style.color;
    }
    if (style.align !== undefined && style.align !== null && style.align !== "") {
      if (!ALIGNMENTS.has(style.align)) {
        throw new SlideStyleInvalidError(`Style align for "${key}" must be left, center or right.`);
      }
      clean.align = style.align;
    }
    if (style.w !== undefined && style.w !== null) {
      const w = Number(style.w);
      if (!Number.isFinite(w) || w < MIN_WIDTH || w > MAX_WIDTH) {
        throw new SlideStyleInvalidError(`Style w for "${key}" must be between ${MIN_WIDTH} and ${MAX_WIDTH}.`);
      }
      clean.w = round(w, 1);
    }
    for (const axis of ["dx", "dy"]) {
      if (style[axis] === undefined) continue;
      const value = Number(style[axis]);
      if (!Number.isFinite(value) || Math.abs(value) > MAX_OFFSET) {
        throw new SlideStyleInvalidError(`Style ${axis} for "${key}" must be within ±${MAX_OFFSET}.`);
      }
      if (value !== 0) clean[axis] = round(value, 1);
    }

    if (Object.keys(clean).length) out[key] = clean;
  }
  return out;
}

function round(n, places) {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}
