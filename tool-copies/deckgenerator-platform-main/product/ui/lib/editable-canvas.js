// =============================================================================
// Editable Canvas — makes a rendered slide directly editable in place, without
// touching the rendering engine.
//
// THE PROBLEM. "The canvas is the source of truth" means clicking the actual
// words on a slide should edit them. But js/templates/*.js are 103 opaque
// functions that each return an HTML STRING — there is no scene graph, no
// per-element data binding, nothing to hook. Reimplementing them as an
// editable component tree would be rewriting the rendering engine, which is
// explicitly out of scope (and would fork behaviour from the exporter, which
// renders the exact same functions server-side).
//
// THE TECHNIQUE. Every template renders its field values as literal, fully-
// escaped text (verified against the whole library before this file was
// written — see the Editor MVP session notes). So instead of changing how
// slides render, this module runs AFTER a slide has rendered and finds each
// field's current value by its EXACT text content:
//
//   1. Build a flat list of "targets" — one per editable leaf value — from
//      the slide's content and its template's schema (via slide-fields.js,
//      the same semantic layer the old field-form used).
//   2. Walk the rendered DOM's text nodes in document order.
//   3. For each text node whose trimmed content exactly matches a remaining
//      target's value, replace that bare text node with a
//      contenteditable="plaintext-only" <span> carrying data-ed-* attributes
//      that say which field (and which array index / row) it is.
//
// Nothing about the template's markup is restructured — a matched span
// simply stands in for the text node that was there, so layout, styling and
// the exporter's own render() are completely unaffected.
//
// WHAT THIS BUYS: click-to-select and double-click-to-edit on any string or
// string-list field, anywhere a template puts it, for all 103 templates,
// with zero per-template code. A field whose current value is an empty
// string renders no text node and so isn't reachable this way — that is a
// disclosed limitation, not a silent failure: renderMissingCount() reports
// it so the caller can decide what, if anything, to do about it.
// =============================================================================
import { editableFields } from "./slide-fields.js";

/** Random-enough per-row identity that survives duplication/deletion without
 *  colliding — rows are reordered/added/removed purely as DOM nodes, so a
 *  stable id (not a numeric index) is what lets commit() regroup them correctly. */
function rowUid() {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Decorates `stageEl` (a rendered <section class="stage">, as returned by
 * buildStage()) in place.
 *
 * @param {HTMLElement} stageEl
 * @param {object} content - the slide's current content object
 * @param {object} schema - the template's schema (field -> description)
 * @returns {{
 *   fieldDefs: object[],           // editableFields() output, for UI labels
 *   rowRegistry: Map<string, object>, // rowUid -> full row object (incl. non-editable keys)
 *   matched: number, total: number,   // for a "N of M fields are editable here" readout
 * }}
 */
export function decorateSlide(stageEl, content, schema) {
  const fieldDefs = editableFields(schema || {});
  const rowRegistry = new Map();

  /** @type {{value:string, field:string, kind:string, index?:number, rowUid?:string, subKey?:string}[]} */
  const targets = [];
  let total = 0;

  for (const def of fieldDefs) {
    if (def.kind === "text") {
      const v = content[def.key];
      if (typeof v === "string" && v.trim()) {
        total++;
        targets.push({ value: v, field: def.key, kind: "text" });
      }
    } else if (def.kind === "list") {
      const arr = Array.isArray(content[def.key]) ? content[def.key] : [];
      arr.forEach((item, index) => {
        if (typeof item === "string" && item.trim()) {
          total++;
          targets.push({ value: item, field: def.key, kind: "list-item", index });
        }
      });
    } else if (def.kind === "structured") {
      const rows = Array.isArray(content[def.key]) ? content[def.key] : [];
      const keys = def.subKeys.length ? def.subKeys : rows.length ? Object.keys(rows[0] || {}) : [];
      rows.forEach((row, rowIndex) => {
        const uid = rowUid();
        rowRegistry.set(uid, structuredClone(row));
        for (const key of keys) {
          const v = row?.[key];
          if (typeof v === "string" && v.trim()) {
            total++;
            // rowIndex travels alongside the uid: the uid is runtime identity
            // (survives reordering in the DOM), the index is the PERSISTED
            // identity a style override is keyed by — see js/style-overrides.js.
            targets.push({ value: v, field: def.key, kind: "row-field", rowUid: uid, rowIndex, subKey: key });
          }
        }
      });
    }
  }

  const { bound, remaining } = bindTextNodes(stageEl, targets);
  const matched = bound + bindElementFallback(stageEl, remaining);
  return { fieldDefs, rowRegistry, matched, total };
}

/** Walks text nodes in document order, wrapping the first still-unclaimed
 *  target it exactly matches. Returns how many were bound and what's left. */
function bindTextNodes(root, targets) {
  const remaining = targets.slice();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      // Chrome (footer/logo, and the v2 frame's top bar + footer) is
      // deck-level, decorated separately by the editor. A content value that
      // happens to equal a chrome cell's text (the deck title appears in the
      // header meta AND in title fields; "Project Name" is a real footer
      // default) must not claim the chrome node — typing in the chrome would
      // silently edit a slide field.
      if (node.parentElement?.closest(".footer, .logo, .v2f-top, .v2f-footer")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const toBind = []; // collected first (mutating the tree mid-walk confuses TreeWalker)
  const nodes = [];
  let node;
  // eslint-disable-next-line no-cond-assign
  while ((node = walker.nextNode())) {
    nodes.push(node);
    const text = node.nodeValue.trim();
    const i = remaining.findIndex((t) => t.value.trim() === text);
    if (i === -1) continue;
    const [target] = remaining.splice(i, 1);
    toBind.push({ node, target });
  }

  // Normalized fallback: templates uppercase, collapse whitespace, or
  // otherwise transform a value in CSS-invisible ways, so the exact match
  // missed it and the text sat uneditable. Strictly a SECOND pass over
  // still-unclaimed nodes, so an exact match always wins first — the
  // duplicate-text hazard stays with the exact pass.
  const claimedNodes = new Set(toBind.map((b) => b.node));
  const norm = (t) => t.replace(/\s+/g, " ").trim().toLowerCase();
  for (const n of nodes) {
    if (claimedNodes.has(n) || !remaining.length) continue;
    const text = norm(n.nodeValue);
    const i = remaining.findIndex((t) => typeof t.value === "string" && norm(t.value) === text);
    if (i === -1) continue;
    const [target] = remaining.splice(i, 1);
    claimedNodes.add(n);
    toBind.push({ node: n, target });
  }

  for (const { node, target } of toBind) wrapTextNode(node, target);
  return { bound: toBind.length, remaining };
}

/**
 * Second pass for values no single text node could match: a template that
 * renders `esc(v).replace(/\n/g, "<br>")` or splits a value into `<p>`s
 * spreads it over several nodes — on the full-bleed statement templates
 * that's the ONLY content, and it was simply uneditable. Bind the deepest
 * ELEMENT whose rendered text equals the value instead (marked multiline;
 * the editor commits via innerText so line breaks round-trip through the
 * template's own \n → <br> rendering).
 */
function bindElementFallback(root, remaining) {
  const norm = (s) => String(s).replace(/\s+/g, " ").trim();
  let bound = 0;
  for (let i = remaining.length - 1; i >= 0; i--) {
    const t = remaining[i];
    if (typeof t.value !== "string" || !t.value.includes("\n")) continue; // only multi-line values split across nodes
    const want = norm(t.value);
    if (!want) continue;
    let match = null;
    for (const el of root.querySelectorAll("*")) {
      if (el.classList.contains("ed-editable") || el.closest(".ed-editable")) continue;
      if (el.querySelector(".ed-editable") || el.closest(".footer, .logo, .v2f-top, .v2f-footer")) continue;
      if (norm(el.textContent) === want) match = el; // document order → the last hit is the deepest
    }
    if (!match) continue;
    match.classList.add("ed-editable");
    match.contentEditable = "false";
    match.tabIndex = 0;
    match.dataset.edField = t.field;
    match.dataset.edKind = t.kind;
    match.dataset.edMultiline = "1";
    if (t.index !== undefined) match.dataset.edIndex = String(t.index);
    remaining.splice(i, 1);
    bound++;
  }
  return bound;
}

function wrapTextNode(node, target) {
  const span = document.createElement("span");
  span.className = "ed-editable";
  span.contentEditable = "false";
  span.tabIndex = 0;
  span.dataset.edField = target.field;
  span.dataset.edKind = target.kind;
  if (target.index !== undefined) span.dataset.edIndex = String(target.index);
  if (target.rowUid) span.dataset.edRow = target.rowUid;
  if (target.rowIndex !== undefined) span.dataset.edRowindex = String(target.rowIndex);
  if (target.subKey) span.dataset.edSubkey = target.subKey;
  span.textContent = node.nodeValue; // untrimmed — preserves the original node's exact whitespace
  node.parentNode.replaceChild(span, node);
}

/* ---- Reading current values back out of the decorated DOM -----------------
 * The DOM is the source of truth for arrays: deleting or duplicating a
 * list-item / row span (see editor.js's floating-toolbar handlers) changes
 * what these functions see on the next read, with no separate bookkeeping. */

/** Full array for a "list" field, in current DOM order. */
export function readListField(stageEl, field) {
  return [...stageEl.querySelectorAll(`.ed-editable[data-ed-kind="list-item"][data-ed-field="${cssEscape(field)}"]`)]
    .map((el) => el.textContent);
}

/** Full array for a "structured" field: every row currently present (by
 *  row-uid, in DOM order of first appearance), each merged from its
 *  registry object (for untouched keys) and its live spans (for edited
 *  scalar keys). */
export function readStructuredField(stageEl, field, rowRegistry) {
  const seen = [];
  const byRow = new Map();
  for (const el of stageEl.querySelectorAll(`.ed-editable[data-ed-kind="row-field"][data-ed-field="${cssEscape(field)}"]`)) {
    const uid = el.dataset.edRow;
    if (!byRow.has(uid)) { byRow.set(uid, {}); seen.push(uid); }
    byRow.get(uid)[el.dataset.edSubkey] = el.textContent;
  }
  return seen.map((uid) => ({ ...(rowRegistry.get(uid) || {}), ...byRow.get(uid) }));
}

function cssEscape(s) {
  return window.CSS?.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, "\\$&");
}
