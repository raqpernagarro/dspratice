// =============================================================================
// Slide Content — schema-aware coercion and render validation (Domain Layer).
//
// WHY THIS EXISTS — the "blank slide" bug.
//
// Every template's render() reads its fields at the type its schema declares.
// A field declared `string[]` is consumed with `.map()`; give it a plain
// string and render() throws:
//
//     TypeError: (s.columns || []).map is not a function
//
// Nothing on the write path used to check this. PATCH .../slides/:slideId
// accepted any JSON, so one wrongly-typed value — most easily from an AI
// action returning a paragraph where the template wants a list — was
// persisted verbatim. From then on EVERY render of that slide threw: the
// editor preview, the viewer, the thumbnail, and the PPTX/PDF export all
// produced a blank slide, and a refresh could never fix it because the bad
// value was in storage. That is the reported bug, and its root cause.
//
// Note the asymmetry that made it so easy to hit: a MISSING field renders
// fine (templates use `|| []` / `|| ""` fallbacks), a WRONGLY TYPED field is
// fatal. So the danger was never absent data — only mistyped data.
//
// THE FIX, in two layers, both applied before anything is written:
//
//   1. coerceContent()  — repair what is unambiguously repairable. A string
//      given for a `string[]` field becomes its lines; an array given for a
//      `string` field becomes joined text. This is lenient on purpose: an AI
//      returning prose for a bullet list should Just Work, not error.
//
//   2. assertRenders()  — the real guarantee. Actually call the template's
//      own render() with the candidate content and require it not to throw.
//      Every one of the 103 templates renders to a plain HTML string with no
//      DOM access, so the Domain can run the exact same code path the viewer
//      and the exporter will later run. If it throws here, it would have
//      produced a blank slide there — so the write is rejected and the
//      previous, known-good content survives untouched.
//
// This is what makes "never replace a valid slide with an invalid one" and
// "never export broken presentations" true by construction, rather than by
// each caller remembering to check.
// =============================================================================
import { allTemplates } from "../../js/templates/index.js";
import { fieldKind } from "../../js/field-kind.js";

export class SlideContentInvalidError extends Error {
  constructor(message, { field, reason } = {}) {
    super(message);
    this.name = "SlideContentInvalidError";
    this.field = field;
    this.reason = reason;
  }
}

/**
 * A field's declared kind, read from its own schema description string.
 * The schema is prose ("string[] — body paragraphs (24px)"), so the kind is
 * inferred from its leading type token — the same three-way split the editor
 * has always used, kept in one place now that the backend needs it too.
 *
 * @returns {"string"|"stringArray"|"objectArray"}
 */
/* Re-exported, not reimplemented. The canonical definition lives in
 * js/field-kind.js so the browser imports the same one — this used to be a
 * second copy kept in step by a comment, and it drifted. */
export { fieldKind };

/** @returns {{name: string, schema: object, example: object}|null} */
export function findTemplate(templateName) {
  return allTemplates.find((t) => t.name === templateName) || null;
}

/** Field name → kind, for one template. */
export function schemaKinds(templateName) {
  const template = findTemplate(templateName);
  const out = {};
  for (const [field, description] of Object.entries(template?.schema || {})) {
    out[field] = fieldKind(description);
  }
  return out;
}

/**
 * Repairs unambiguously-repairable type mismatches in a content patch.
 *
 * Deliberately lenient rather than strict: the common real-world case is an
 * AI (or a paste) supplying the right information in the wrong container,
 * and rejecting that outright would be hostile when the intent is obvious.
 * What it will NOT do is invent structure — an objectArray field can only be
 * satisfied by real objects, so anything else is left for assertRenders() to
 * reject rather than "repaired" into something meaningless.
 *
 * Unknown fields (not in the template's schema) are dropped: they cannot
 * render, and silently carrying them would let a swap or an AI response
 * accumulate dead keys in storage.
 *
 * @returns {{content: object, dropped: string[]}}
 */
export function coerceContent(templateName, patch = {}) {
  const kinds = schemaKinds(templateName);
  const content = {};
  const dropped = [];

  for (const [field, raw] of Object.entries(patch)) {
    const kind = kinds[field];
    if (!kind) { dropped.push(field); continue; }

    if (kind === "string") {
      if (typeof raw === "string") content[field] = raw;
      else if (Array.isArray(raw)) content[field] = raw.filter((v) => typeof v === "string").join("\n");
      else if (raw == null) content[field] = "";
      else if (typeof raw === "number" || typeof raw === "boolean") content[field] = String(raw);
      else content[field] = raw; // an object here is a genuine mismatch — assertRenders() decides
      continue;
    }

    if (kind === "stringArray") {
      if (Array.isArray(raw)) {
        content[field] = raw.map(toText);
      } else if (typeof raw === "string") {
        // The exact case that caused the blank-slide bug: prose supplied for
        // a list field. Split on newlines, which is also how the editor's
        // own list control serialises.
        content[field] = raw.split("\n").map((l) => l.trim()).filter(Boolean);
      } else if (raw == null) {
        content[field] = [];
      } else {
        content[field] = raw;
      }
      continue;
    }

    // objectArray — structure cannot be inferred from a string, so pass it
    // through untouched and let the render check be the judge.
    content[field] = raw;
  }

  return { content, dropped };
}

/**
 * One list entry as text. The model sometimes answers a plain list with rows
 * — `items: [{ label: "3 Nov", active: true }]` where the layout wants
 * `["3 Nov"]` — and `String()` of a row is "[object Object]", which then
 * printed on five bars of a finished slide. The row's own words are what was
 * meant: its label-like field when it has one, else its text values joined.
 */
const TEXT_KEYS = ["label", "title", "text", "name", "value", "heading", "word"];
export function toText(v) {
  if (typeof v === "string") return v;
  if (v == null) return "";
  if (typeof v !== "object") return String(v);
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(" ");
  for (const k of TEXT_KEYS) if (typeof v[k] === "string" && v[k].trim()) return v[k];
  return Object.values(v).filter((x) => typeof x === "string" || typeof x === "number").join(" — ");
}

/**
 * The real guarantee: run the template's own render() over the candidate
 * content and require it not to throw.
 *
 * `merged` must be the FULL content the slide would end up with (existing
 * content + the patch), not the patch alone — a template reads every field,
 * so validating a partial object would fail on fields the patch never
 * touched.
 *
 * @throws {SlideContentInvalidError}
 */
export function assertRenders(templateName, merged) {
  const template = findTemplate(templateName);
  if (!template) {
    throw new SlideContentInvalidError(`Unknown template "${templateName}".`, { reason: "unknown-template" });
  }
  try {
    const html = template.render({ ...merged });
    if (typeof html !== "string") {
      throw new Error("render() did not return markup.");
    }
    // A value of the wrong shape that renders anyway: a structured row printed
    // where text belongs. It does not throw, so it would ship.
    if (html.includes("[object Object]")) {
      throw new Error("a field holds structured data where the layout prints text");
    }
  } catch (err) {
    throw new SlideContentInvalidError(
      `This change would make the slide fail to render (${err.message}). The previous content was kept.`,
      { reason: "render-failed" }
    );
  }
}

/**
 * The one call every write path uses: coerce a patch, merge it over the
 * slide's existing content, prove the result renders, and hand back the
 * merged content ready to persist.
 *
 * @param {string} templateName
 * @param {object} existingContent - the slide's current, known-good content
 * @param {object} patch - only the fields being changed
 * @returns {{content: object, dropped: string[]}} content = the full merged set
 * @throws {SlideContentInvalidError} if the result would not render
 */
export function prepareContentUpdate(templateName, existingContent = {}, patch = {}) {
  const { content: coerced, dropped } = coerceContent(templateName, patch);
  const merged = { ...existingContent, ...coerced };
  assertRenders(templateName, merged);
  return { content: merged, dropped };
}
