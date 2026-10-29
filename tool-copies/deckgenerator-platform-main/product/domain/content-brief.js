// Content brief helpers + figure provenance.
// Rule: a scene may be illustrative; a number never is. Every number on a
// finished slide must trace to the prompt, coach answers, references or proof.
import { TONES } from "./voice.js";

const MAX = 8;

export function normalizeBrief(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = {};
  for (const [k, v] of Object.entries(raw)) out[k] = Array.isArray(v) ? v.slice(0, MAX) : v;
  if (Array.isArray(raw.proof)) {
    out.proof = raw.proof
      .filter((p) => p && typeof p === "object" && typeof p.fact === "string" && p.fact.trim())
      .slice(0, MAX);
  }
  if (!TONES.includes(out.register)) out.register = "thought";
  return out;
}

const SLIDE_COUNT = /\b\d+\s*-?\s*slides?\b/gi;
// Digits glued to a preceding letter (B2B, Q3, H2) are labels, not figures.
// A single leading x/× (a multiplier: x2, ×10) still counts as a figure.
const PRE = "(?<![A-Za-z\\d])|(?<=(?<![A-Za-z\\d])[x×])";
const NUM = new RegExp(`(?:${PRE})\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|(?:(?<![A-Za-z\\d.])|(?<=(?<![A-Za-z\\d])[x×]))\\d+(?:\\.\\d+)?`, "g");

export function numbersIn(text) {
  if (typeof text !== "string") return [];
  const out = [];
  for (const m of text.replace(SLIDE_COUNT, " ").matchAll(NUM)) out.push(m[0].replace(/,/g, ""));
  return out;
}

function textOf(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map(textOf).join("\n");
  if (typeof v === "object") return Object.values(v).map(textOf).join("\n");
  return "";
}

export function allowedNumbers({ prompt, answers, references, brief } = {}) {
  const set = new Set();
  const add = (v) => numbersIn(textOf(v)).forEach((n) => set.add(n));
  add(prompt);
  add(answers);
  add(references);
  for (const p of brief?.proof || []) add(p?.fact);
  return set;
}

/** The figures a prompt may list, at most `maxChars` of them joined. The
 *  material's own words (prompt, answers, the brief's proof) come first, then
 *  references in order: a long reference can hold thousands of numbers, and
 *  listing all of them would push the fill prompt past the CLI's cap. The
 *  figure check after composition still uses the full allowedNumbers set, so
 *  an unlisted reference figure the model uses is kept, not stripped. */
export const MAX_PROMPT_FIGURE_CHARS = 2_000;
export function promptFigures({ prompt, answers, references, brief } = {}, maxChars = MAX_PROMPT_FIGURE_CHARS) {
  const out = [];
  const seen = new Set();
  let length = 0;
  const add = (v) => {
    for (const n of numbersIn(textOf(v))) {
      if (seen.has(n)) continue;
      if (length + n.length + 2 > maxChars) return false;
      seen.add(n);
      out.push(n);
      length += n.length + 2;
    }
    return true;
  };
  for (const v of [prompt, answers, ...(brief?.proof || []).map((p) => p?.fact), ...(Array.isArray(references) ? references : [references])]) {
    if (!add(v)) break;
  }
  return out;
}

const SKIP_KEYS = new Set(["meta", "footer", "notes"]);
const IMG = /\.(png|jpe?g|gif|svg|webp|avif|mp4|webm|woff2?|ttf)(\?.*)?$/i;

function isNonVisible(s) {
  const t = s.trim();
  return /^\/?assets\//.test(t) || /^[a-z][a-z0-9+.-]*:\/\//i.test(t) || IMG.test(t) ||
    /^#[0-9a-f]{3,8}$/i.test(t);
}

function visible(s) {
  return s
    .replace(/var\([^)]*\)/gi, " ")
    .replace(/\b(?:rgba?|hsla?)\([^)]*\)/gi, " ")
    .replace(/#[0-9a-f]{3,8}\b/gi, " ");
}

/** A list of rows whose `number` runs exactly 1, 2, … N in order is numbered
 *  (a card's badge), and that `number` is an index, not a figure. Only this
 *  key: real data under any other key is still checked. */
const INDEX_KEY = "number";
const isRow = (x) => x && typeof x === "object" && !Array.isArray(x);
function isIndexList(list) {
  return list.length > 0 && list.every((r, i) => isRow(r) && INDEX_KEY in r
    && (typeof r[INDEX_KEY] === "number" || typeof r[INDEX_KEY] === "string") && /^\d+$/.test(String(r[INDEX_KEY]).trim()) && Number(r[INDEX_KEY]) === i + 1);
}
function withoutIndex(row) {
  const { [INDEX_KEY]: _, ...rest } = row;
  return rest;
}

/** Numbers under these keys place or size things on the slide — a gantt
 *  block's l/w/top/h, a bubble's x/y/d, a row's start/span, the item in focus —
 *  and are never shown, so they are not figures. Only numbers: a string under
 *  one of these keys is read like any other text. Data keys (value, values, v,
 *  f, share, count) are not here and stay checked. */
const LAYOUT_KEYS = new Set([
  "l", "w", "h", "x", "y", "top", "left", "width", "cx", "cy", "d", "ns", "size",
  "row", "lane", "start", "span", "from", "to", "at", "today", "weight", "grow",
  "active", "cols", "days", "tools", "edges", "max",
]);
const allNumbers = (x) => (Array.isArray(x) ? x.every(allNumbers) : typeof x === "number");
const isLayout = (k, x) => LAYOUT_KEYS.has(k) && allNumbers(x);

function collect(v, out) {
  if (typeof v === "string") { if (!isNonVisible(v)) out.push(v); }
  else if (typeof v === "number") out.push(String(v));
  else if (Array.isArray(v)) (isIndexList(v) ? v.map(withoutIndex) : v).forEach((x) => collect(x, out));
  else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) if (!SKIP_KEYS.has(k) && !isLayout(k, x)) collect(x, out);
  }
}

const LEADING_MARKER = /^\s*(?:\d{1,2}[.)]|0\d)\s+/;
// Structural counters name a part of the deck's own plan, not a measurement:
// "Phase 1", "Step 2", "Week 3" (up to 12). "Phase 13" and dates still count.
const COUNTER = /\b(Phase|Step|Wave|Sprint|Week|Day|Stage|Option)\s+(\d{1,2})\b/gi;

function figureText(s) {
  return visible(s.replace(LEADING_MARKER, "").replace(COUNTER, (m, word, n) => (+n >= 1 && +n <= 12 ? word : m)));
}

export function untraceable(content, allowed) {
  const strings = [];
  collect(content, strings);
  const bad = [];
  for (const s of strings) {
    // List markers ("1.", "2)") are allowed; a bare "7" is a figure.
    const mk = /^\s*(\d{1,2})\s*[.)]\s*$/.exec(s);
    if (mk && +mk[1] >= 1 && +mk[1] <= 10) continue;
    // …and so is one leading a line ("1. Discovery", "2) Pilot", "03 Scale"),
    // and a structural counter ("Phase 2").
    for (const n of numbersIn(figureText(s))) {
      if (/^0[1-9]$/.test(n) || allowed.has(n) || bad.includes(n)) continue;
      bad.push(n);
    }
  }
  return bad;
}

/** Fields that hold a figure as text: a stat card's "75%", a bar's "$9.4M". */
const VALUE_KEY = /^(value|display|stat|metric|number|figure|amount|kpi)$/i;

/**
 * `text` without the clauses that carry an untraceable figure: "Releases sped
 * up, saving 40 hours." → "Releases sped up." A clause is a sentence or a part
 * of one set off by a comma, semicolon, colon or dash. "" when every clause
 * held one.
 */
export function withoutFigureClauses(text, allowed) {
  if (!untraceable(text, allowed).length) return text;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = [];
  for (const sentence of sentences) {
    if (!untraceable(sentence, allowed).length) { kept.push(sentence); continue; }
    const end = /[.!?]$/.test(sentence.trim()) ? sentence.trim().slice(-1) : "";
    const body = end ? sentence.trim().slice(0, -1) : sentence.trim();
    const clauses = body.split(/\s*(?:[,;:]|\s[—–-]\s)\s*/).filter((c) => c && !untraceable(c, allowed).length);
    if (clauses.length) kept.push(clauses.join(", ") + end);
  }
  return kept.join(" ").trim();
}

/**
 * `content` with every untraceable figure taken out, at the smallest unit
 * holding it:
 * - a chart datum or stat card (a row whose number, or whose value/display
 *   text, is the invented figure) is dropped — one bar, never the chart;
 * - prose loses the clause holding the figure, not the field ("Teams moved
 *   closer, saving 40 hours" → "Teams moved closer"); a list line left empty
 *   is dropped, a text field left empty is "" (the caller names it);
 * - any other row keeps its other fields: a card titled "Year 1" loses only
 *   its title. Chrome and notes are left alone.
 */
export function stripUntraceable(content, allowed) {
  const bad = (v) => untraceable(v, allowed).length > 0;
  const isDatum = (row) => Object.entries(row).some(([k, x]) => !isLayout(k, x)
    && (typeof x === "number" || (typeof x === "string" && VALUE_KEY.test(k))) && bad(x));
  const walkRow = (row, keep) => Object.fromEntries(Object.entries(row).map(([k, x]) =>
    [k, SKIP_KEYS.has(k) || k === keep || isLayout(k, x) ? x : walk(x)]));
  const walk = (v) => {
    if (typeof v === "number") return bad(v) ? "" : v;
    if (typeof v === "string") return withoutFigureClauses(v, allowed);
    if (Array.isArray(v)) {
      // A numbered list keeps its index; only the rows' other fields are checked.
      const index = isIndexList(v);
      return v
        .filter((x) => !(typeof x === "number" && bad(x)))
        .filter((x) => !(isRow(x) && isDatum(index ? withoutIndex(x) : x)))
        .map((x) => (index ? walkRow(x, INDEX_KEY) : walk(x)))
        .filter((x, i) => !(typeof x === "string" && !x && typeof v[i] === "string" && v[i]));
    }
    if (v && typeof v === "object") return walkRow(v);
    return v;
  };
  const out = {};
  for (const [k, v] of Object.entries(content || {})) out[k] = SKIP_KEYS.has(k) || isLayout(k, v) ? v : walk(v);
  return out;
}

/**
 * How many data points `content` shows: each chart datum or stat row, each
 * number in a series, each top-level value field with a figure in it.
 */
export function dataPoints(content) {
  let n = 0;
  const hasFigure = (x) => typeof x === "number" || (typeof x === "string" && numbersIn(x).length > 0);
  const walk = (v, top) => {
    if (Array.isArray(v)) {
      for (const x of isIndexList(v) ? v.map(withoutIndex) : v) {
        if (typeof x === "number") n += 1;
        else if (x && typeof x === "object" && !Array.isArray(x)
          && Object.entries(x).some(([k, y]) => !isLayout(k, y) && (typeof y === "number" || (VALUE_KEY.test(k) && hasFigure(y))))) n += 1;
        else walk(x, false);
      }
    } else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (SKIP_KEYS.has(k) || isLayout(k, x)) continue;
        if (top && VALUE_KEY.test(k) && hasFigure(x)) n += 1;
        else walk(x, false);
      }
    }
  };
  walk(content, true);
  return n;
}

/** Top-level fields that held words before and are empty now. */
export function emptiedFields(before, after) {
  const filled = (v) => (typeof v === "string" ? v.trim() !== "" : Array.isArray(v) ? v.length > 0 : v != null);
  return Object.keys(before || {}).filter((k) => !SKIP_KEYS.has(k) && filled(before[k]) && !filled(after?.[k]));
}
