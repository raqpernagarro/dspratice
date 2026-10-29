// =============================================================================
// Slide Fields — the semantic layer between a template's schema and the editor.
//
// The editor used to render a template's schema raw. That leaked the
// implementation straight into the UI: the label was the literal field key
// ("eyebrow", "subhead", "lede", "colA"), and the help text was the schema's
// own engineering prose — "string[] — body paragraphs (24px), 568px wide
// each". Type tokens and pixel measurements are facts about the renderer, not
// about the message the user is writing.
//
// This module is the translation. It answers three questions for any field:
//   label()  — what a person would call this
//   help()   — what it's for, with the type/pixel noise stripped
//   kind()   — how to edit it (text / list / structured rows)
//
// It deliberately holds NO layout, styling or positioning concepts, because
// the editor deliberately offers none: templates own all of that, and the
// editor only ever changes content.
// =============================================================================
/* Relative, not "/js/field-kind.js". A root-absolute specifier resolves only
 * in the browser, which made this module unimportable in Node — so the tests
 * could not exercise it at all, and the export-alias bug below shipped
 * unnoticed. Relative resolves correctly from both URLs the UI is served at
 * (/lib/... and /product/ui/lib/...) and from the filesystem. */
import { editorFieldKind } from "../../../js/field-kind.js";

/**
 * Human labels for field keys whose engine name means nothing to a reader.
 * Anything not listed falls back to a de-camelCased, capitalised key, which
 * already reads correctly for the majority ("title", "subtitle", "heading",
 * "quote", "caption", "body", "steps", "stats"…).
 */
const LABELS = {
  eyebrow: "Overline",
  kicker: "Overline",
  lede: "Intro paragraph",
  subhead: "Supporting line",
  subtitle: "Subtitle",
  emphasis: "Highlighted line",
  columns: "Body columns",
  paragraphs: "Paragraphs",
  bullets: "Bullet points",
  items: "Items",
  body: "Body text",
  attribution: "Attributed to",
  source: "Source",
  signoff: "Sign-off",
  crumbs: "Breadcrumb trail",
  breadcrumb: "Breadcrumb",
  chips: "Tags",
  headers: "Column headers",
  rows: "Table rows",
  colA: "Left column",
  colB: "Right column",
  col2: "Second column",
  col3: "Third column",
  columnA: "Left column",
  columnB: "Right column",
  listA: "First list",
  listB: "Second list",
  topLeft: "Top-left",
  topRight: "Top-right",
  bottom: "Bottom",
  left: "Left side",
  right: "Right side",
  center: "Centre",
  pre: "Before",
  post: "After",
  titleStart: "Title (first part)",
  titleEnd: "Title (last part)",
  titleLine1: "Title line 1",
  titleLine2: "Title line 2",
  line1: "Line 1",
  line2: "Line 2",
  line3: "Line 3",
  line4: "Line 4",
  aiTitle: "AI panel title",
  aiBullets: "AI panel bullets",
  stat: "Statistic",
  statLabel: "Statistic label",
  note: "Note",
  callout: "Callout",
  callouts: "Callouts",
  intro: "Introduction",
  about: "About text",
  aboutLabel: "About label",
  work: "Experience",
  education: "Education",
  skills: "Skills",
  members: "Team members",
  logos: "Logos",
  logo: "Logo",
  photo: "Photo",
  image: "Image",
  hideFooter: "Hide footer",
  handwritten: "Handwritten note",
};

/** Field keys that are plumbing rather than content — never offered for editing. */
const HIDDEN = new Set(["hideFooter"]);

/** @returns {"text"|"list"|"structured"} how this field should be edited.
 * MUST agree with product/domain/slide-content.js's fieldKind() — the client
 * and server disagreeing about a field's type is exactly the class of bug
 * that let the AI blank whole templates (a `{title,desc}` field declared as
 * plain "string" came back as prose and rendered as nothing). */
/* One shared definition, aliased into this module's own vocabulary. This was a
 * second copy of the same regexes, kept in step by a comment in each file
 * saying the other must agree — and they did not: `string[3]` matched here but
 * not on the server, so a real array was joined into a string and the
 * template's `.map()` threw.
 *
 * A local `const`, NOT `export { editorFieldKind as fieldKind }`. An export
 * alias creates no local binding, so the fieldKind() calls further down this
 * file had nothing in scope — a ReferenceError that only fires when
 * editableFields() actually runs, which is during the editor's canvas render.
 * `node --check` passes it and a test importing the EXPORT passes too; the
 * editor simply rendered an empty canvas with nothing in the console. */
const fieldKind = editorFieldKind;
export { fieldKind };

/** "aiTitle" → "Ai title" → used only when LABELS has no entry. */
function humanise(key) {
  const spaced = String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function fieldLabel(key) {
  return LABELS[key] || humanise(key);
}

/**
 * Help text with the engineering stripped out.
 *
 *   "string[] — body paragraphs (24px), 568px wide each"  →  "Body paragraphs"
 *   "string — large display headline (128px)"             →  "Large display headline"
 *
 * Removes the leading type token, every pixel measurement, and any trailing
 * remark that only describes rendering. Returns "" when nothing meaningful
 * survives, so the caller can omit the help line entirely rather than print a
 * stub.
 */
export function fieldHelp(description) {
  let d = String(description || "");

  // 1. Drop the leading type token and any qualifier attached to it, plus the
  //    em-dash that separates it from the actual description.
  d = d.replace(/^\s*(string\[\]|string \[\]|string|array of\s*\{[^}]*\}|array)\s*/i, "");
  d = d.replace(/^\s*\((optional|required)\)\s*/i, "");
  d = d.replace(/^\s*[—–\-:,]\s*/, "");

  // 2. Drop every parenthetical. Across this template library they are
  //    consistently render details — "(128px)", "(Equip Extended, bold)",
  //    "(24px), 568px wide each", "(one per line)" — i.e. exactly the
  //    implementation noise this module exists to hide. Done as a whole-group
  //    removal so it can't chew through the surrounding sentence the way a
  //    "strip from px to the next comma" rule did (that turned "large 96px
  //    heading line (Equip Extended, bold)" into "Large, bold)").
  d = d.replace(/\([^()]*\)/g, " ");

  // 3. Any bare measurement left outside parentheses, e.g. "568px wide each".
  d = d.replace(/\b~?\d+\s*px\b/gi, " ");

  // 4. Tidy: collapse whitespace, drop stranded punctuation at either end.
  d = d.replace(/\s{2,}/g, " ").replace(/\s+([,.;])/g, "$1");
  d = d.replace(/^[\s—–\-:,;]+/, "").replace(/[\s,;:—–-]+$/, "").trim();

  if (!d || d.length < 2) return "";
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/** True when the schema marks the field optional — surfaced as a quiet
 *  "optional" tag instead of being buried in the help sentence. */
export function fieldOptional(description) {
  return /\(optional\)|\boptional\b/i.test(String(description || ""));
}

/** The sub-keys of a structured field, read from its own description:
 *  "array of { value, topic, description } — three blocks" → [value, topic, description] */
export function structuredKeys(description) {
  const match = String(description || "").match(/array of\s*\{([^}]*)\}/i);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((part) => part.split(":")[0].replace(/\?/g, "").replace(/\[\]/g, "").trim())
    .filter((k) => /^[A-Za-z_$][\w$]*$/.test(k));
}

/**
 * The editable field list for a template, in schema order, already translated.
 * @returns {{key, label, help, kind, subKeys}[]}
 */
export function editableFields(schema = {}) {
  return Object.entries(schema)
    .filter(([key]) => !HIDDEN.has(key))
    .map(([key, description]) => {
      const kind = fieldKind(description);
      return {
        key,
        label: fieldLabel(key),
        help: fieldHelp(description),
        optional: fieldOptional(description),
        kind,
        subKeys: kind === "structured" ? structuredKeys(description) : [],
      };
    });
}
