// js/field-kind.js
// =============================================================================
// What TYPE is a template schema field? One answer, for the whole system.
//
// Template schemas describe their fields in prose — "string[3] — bold column
// titles", "array of { label, value }", "{ title, body }" — and both the server
// and the browser have to decide, from that string, whether a value should be
// text, a flat list, or a structured object.
//
// They used to decide separately, in two copies of the same regexes kept in
// step by a comment in each saying the other must agree. They did not agree:
// neither `string[3]` nor `array of [a, b, c]` matched one of them, so real
// arrays were joined into a single string and templates calling `.map()` threw
// — a hard render failure that reached the deck as a blank slide.
//
// This lives in js/ rather than product/ because it belongs to the template
// library, and because js/ is the one tree served to the browser as well as
// read by the server. Both sides import THIS.
//
// Returns:
//   "objectArray"  structured — an object, or a list of objects/lists. Never
//                  inferable from a string, so callers pass it through
//                  untouched and let the render check judge.
//   "stringArray"  a flat list of strings.
//   "string"       plain text.
// =============================================================================

/**
 * @param {string} description - the schema's own description of the field.
 * @returns {"objectArray"|"stringArray"|"string"}
 */
export function fieldKind(description) {
  const d = String(description || "").toLowerCase().trim();

  /* ---- unambiguously structured -------------------------------------------
   * Named object shapes, and string[][] — a list of LISTS, whose items are
   * arrays and which a text decorator can only mangle. string[][] has to be
   * tested before string[]. */
  if (d.includes("array of {") || d.includes("array of{")) return "objectArray";
  if (d.startsWith("string[][]")) return "objectArray";
  if (/^array\s*<\s*\{/.test(d)) return "objectArray";
  if (/^\{/.test(d)) return "objectArray";
  if (/^object\b/.test(d)) return "objectArray";

  /* ---- flat list of strings -----------------------------------------------
   * BEFORE the catch-all "array of anything" rule below, not after. Order was
   * the bug: `^array\b` claimed "array<string>" and "array of 3 strings" for
   * structured before either could be recognised as a plain list. The second
   * form is live — planning/grid-15 declares `notes: "array of 3 strings"` —
   * so that field was being treated as structured, which is also the field
   * that took the whole slide down when a string was written over it.
   *
   * The SIZED form matters for the same reason: `columns: "string[3] — bold
   * column titles"` once fell through to plain text, the value was joined into
   * one newline-separated string, and `cols.slice(0,3).map(...)` threw
   * "map is not a function" on every comparison-table template. */
  if (/^string\s*\[\s*\d*\s*\]/.test(d) || d.includes("string []")) return "stringArray";
  if (/^array\s*<\s*string\s*>/.test(d)) return "stringArray";
  if (/\barray\s+of\s+(?:up\s+to\s+)?\d*\s*strings?\b/.test(d)) return "stringArray";

  // ---- anything else calling itself an array is structured -----------------
  if (/^array\b/.test(d)) return "objectArray";

  return "string";
}

/** The editor's own vocabulary for the same three kinds. Kept as a mapping
 *  rather than a second implementation — that is what drifted before. */
const EDITOR_LABEL = {
  objectArray: "structured",
  stringArray: "list",
  string: "text",
};

/**
 * @param {string} description
 * @returns {"structured"|"list"|"text"}
 */
export function editorFieldKind(description) {
  return EDITOR_LABEL[fieldKind(description)];
}
