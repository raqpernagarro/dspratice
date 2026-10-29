// =============================================================================
// Generation Service — M15, Domain Layer.
//
// Orchestrates a single AI generation request: validates the request shape,
// creates a Generation record, calls the AI Provider, and persists the
// result. Depends only on the AIProvider contract (infrastructure/ai/
// ai-provider.js) — this file never imports a concrete provider
// implementation, so it has no idea whether the mock, Claude Code, or the
// Anthropic API is answering a given call.
//
// Structural note: every other Service in this codebase (ExportService,
// PresentationService) imports its own dependencies at module scope and
// exports one ready singleton. This file deliberately does not, for its one
// provider dependency: the instruction for this phase is explicit that
// Domain code must never import a provider implementation directly, and a
// module-scope singleton here would require importing one just to construct
// it. Instead, the provider is passed into the constructor, and the
// singleton is built where the concrete provider is chosen — the
// application/routes layer (generations.js) — which is the correct
// composition root for this one decision. The Generation Repository is
// still imported directly at module scope, exactly like every other
// Service's Repository dependency; only the provider is different.
//
// No conversation logic, no billing/rate-limiting, no job queue. Drafting runs
// inside the request unless the caller asks for `background`, in which case it
// continues after the response and the client polls; approval always does.
// =============================================================================
import { generationRepository, InvalidGenerationTransitionError } from "../storage/generation-repository.js";
import { sanitizeCoaching, sanitizeAnswers } from "./brief-service.js";
import { normalizeBrief, allowedNumbers, promptFigures, numbersIn, untraceable, stripUntraceable, dataPoints, emptiedFields } from "./content-brief.js";
import { ReferenceService, ReferenceValidationError, MAX_REFERENCES_PER_GENERATION } from "./reference-service.js";
import { storeImportedImage } from "./media-upload-service.js";
import { readFile } from "node:fs/promises";
import { presentationService } from "./presentation-service.js";
import { findTemplate, prepareContentUpdate, toText } from "./slide-content.js";
import { liveTemplates } from "./live-templates.js";
import { outlineSignatures, applyAnalysis, contentSignature } from "./content-signature.js";
import { choosePhotos, photoQueue } from "./photo-selection.js";
import { shortlistFor, isDataLayout } from "./template-scoring.js";
import { enforceVariety } from "./variety.js";
import { requestedSlideCount } from "./slide-count.js";
import { resolvePageIndexes, labelMatches } from "./slide-index.js";
import { reviewSlides } from "./slide-review-service.js";
import { retentionOf, MIN_RETENTION } from "./content-retention.js";
import { lintText, lintDeck } from "../../js/voice-lint.js";
import darkSafe from "../../js/dark-safe.json" with { type: "json" };

/** Templates verified to render legibly in dark, by tools/audit-dark-mode.mjs.
 *  The engine opens and closes decks dark, so a template that cannot do dark
 *  must never reach that slot. */
const DARK_SAFE = new Set(darkSafe.safe || []);

/** Layouts the hook slide (the outline's `role: "hook"`, slide 2) may use: one
 *  short sentence or question, set large, on a light page — the first content
 *  beat after the dark cover. No big-number layouts: a hook carries no figure
 *  the material did not give, and a big-number layout without one is empty.
 *  Each is a registered light statement/quote template; see the Task 6 report
 *  for why each was chosen. */
export const HOOK_TEMPLATES = [
  "marketing/text-03",        // one centred 100px statement with a muted eyebrow
  "brand-guidelines/split-01", // a small caption over a large statement, left half
  "brand-guidelines/hero-02", // a large statement on a grey card filling the body
  "core/quote-single",        // one large full-page line; the attribution is optional
];

/**
 * Takes the untraceable figures out of one built slide and says what that
 * did. `broken` is true when what is left is not a slide: a data layout down
 * to fewer than two points (or fewer than it had, if it only ever had one), or
 * a stat that lost its value.
 */
export function stripFigures(template, content, allowed) {
  const invented = untraceable(content, allowed);
  if (!invented.length) return { invented, content, emptied: [], broken: false };
  const stripped = stripUntraceable(content, allowed);
  const emptied = emptiedFields(content, stripped);
  const before = dataPoints(content);
  const after = dataPoints(stripped);
  const broken = isDataLayout(template) && after < Math.min(2, before);
  return { invented, content: stripped, emptied, broken };
}

/** The note for a slide whose figures were taken out. Fields left empty are
 *  named — a title or statement never disappears silently. */
function figuresNote(n, { invented, emptied }, tail = "") {
  const left = emptied.length ? `; ${emptied.join(", ")} ${emptied.length > 1 ? "were" : "was"} left empty` : "";
  return `Slide ${n}: removed figures not in the material (${invented.join(", ")})${left}${tail}.`;
}

/**
 * The figure check, again, after visual review. Review can rebuild a slide on
 * an alternate layout over that layout's own example, which brings its sample
 * figures ("$115M", "Q3 23") back. Only slides review changed are checked, and
 * a figure the slide already showed before review stays allowed (that covers
 * system-set numbers such as contents page numbers). A slide the strip would
 * leave broken goes back to its pre-review version.
 */
export function recheckFiguresAfterReview(before, after, { allowed, note = () => {} } = {}) {
  return (after || []).map((slide, i) => {
    const prior = before?.[i];
    if (!slide?.content || !prior) return slide;
    const same = slide.templateReference?.templateName === prior.templateReference?.templateName
      && JSON.stringify(slide.content) === JSON.stringify(prior.content);
    if (same) return slide;
    const here = new Set([...allowed, ...untraceable(prior.content || {}, new Set())]);
    const template = findTemplate(slide.templateReference?.templateName);
    const result = stripFigures(template, slide.content, here);
    if (!result.invented.length) return slide;
    if (result.broken) {
      note(figuresNote(i + 1, { ...result, emptied: [] }, " — review's layout change was undone"));
      return { ...prior, __shortlist: undefined };
    }
    note(figuresNote(i + 1, result, " after review"));
    return { ...slide, content: result.content };
  });
}

// ---- Voice pass -------------------------------------------------------------

/** Each voice request's prompt stays under this many characters. */
const VOICE_PROMPT_MAX = 28_000;
/** The voice prompt's fixed text (rules + register), with headroom: measured
 *  at about 3,300 characters for the longest register on 2026-10-21. The
 *  batching test checks the real prompt stays under VOICE_PROMPT_MAX. */
const VOICE_PROMPT_BASE = 4_500;
/** Chrome the system sets; never sent to the editor. */
const VOICE_SKIP = new Set(["meta", "footer"]);

const isPlain = (v) => v && typeof v === "object" && !Array.isArray(v);

/** A string the editor must not touch: empty, an asset path, a URL, a colour. */
function fixedString(s) {
  const t = s.trim();
  return !t || ASSET_PATH.test(t) || /^#[0-9a-f]{3,8}$/i.test(t) || /^var\(/.test(t);
}

/** Same keys, same nesting, same list lengths, same leaf types. */
function sameShape(a, b) {
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => sameShape(x, b[i]));
  if (isPlain(a)) {
    if (!isPlain(b)) return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => k in b && sameShape(a[k], b[k]));
  }
  if (a === null) return b === null;
  return typeof a === typeof b;
}

/** Keys the system sets on contents slides (resolvePageIndexes / pageKeyFor):
 *  never the editor's to change or reorder. */
const VOICE_FIXED_KEYS = new Set(["page", "range"]);

/** Which item field of a contents slide carries the page, and whether the
 *  layout shows page spans; null for any other layout. */
function contentsPageKey(name) {
  const schema = findTemplate(name)?.schema?.items;
  if (typeof schema !== "string" || !/\blabel\b/.test(schema)) return null;
  // "range" in the schema means the layout shows page spans ("05 – 12"):
  // main/index-02 keeps them in a `range` field, portfolio/index-02 in `page`.
  const span = /\brange\b/.test(schema);
  if (/\bpage\b/.test(schema)) return { key: "page", span };
  if (span) return { key: "range", span };
  return null;
}

/** For each contents entry ("slide:item"), the slide its page points at: the
 *  first later slide whose heading its label matches (resolvePageIndexes'
 *  own rule), or -1. */
function contentsLinks(deck) {
  const links = new Map();
  deck.forEach((s, i) => {
    const items = s?.content?.items;
    if (!Array.isArray(items) || !contentsPageKey(s?.templateReference?.templateName)) return;
    items.forEach((item, k) => {
      if (typeof item?.label !== "string") return;
      let j = i + 1;
      while (j < deck.length && !labelMatches(item.label, deck[j]?.content)) j++;
      links.set(`${i}:${k}`, j < deck.length ? j : -1);
    });
  });
  return links;
}

/** The edit, with every leaf that is not prose put back to the original. */
function keepFixed(orig, edit) {
  if (Array.isArray(orig)) return orig.map((x, i) => keepFixed(x, edit[i]));
  if (isPlain(orig)) {
    return Object.fromEntries(Object.keys(orig).map((k) => [k, VOICE_FIXED_KEYS.has(k) ? orig[k] : keepFixed(orig[k], edit[k])]));
  }
  if (typeof orig === "string") return fixedString(orig) ? orig : edit;
  return orig;
}

/** The longest a string may grow: 10% over its own length, or the layout's
 *  budget for that field when the template's example gives one. */
function voiceLimit(orig, example) {
  const own = Math.ceil(orig.length * 1.1);
  return typeof example === "string" ? Math.max(own, textBudget(example.length)) : own;
}

/** Calls `fn(orig, edit, example, inNotes)` for every string leaf, walking
 *  the template's example alongside (a list's items share its first example).
 *  `inNotes` is true under a `notes` key (speaker notes, not on the slide). */
function eachString(orig, edit, example, fn, inNotes = false) {
  if (typeof orig === "string") return fn(orig, edit, example, inNotes);
  if (Array.isArray(orig)) {
    orig.forEach((x, i) => eachString(x, edit?.[i], Array.isArray(example) ? (example[i] ?? example[0]) : undefined, fn, inNotes));
  } else if (isPlain(orig)) {
    for (const k of Object.keys(orig)) eachString(orig[k], edit?.[k], isPlain(example) ? example[k] : undefined, fn, inNotes || k === "notes");
  }
}

/** Figures in one string (list markers and structural counters excepted). */
const figuresIn = (text) => untraceable([text], new Set());

/** Figures the slide shows: every string outside speaker notes. */
function visibleFigures(content) {
  const out = new Set();
  eachString(content, undefined, undefined, (o, _e, _x, inNotes) => { if (!inNotes) figuresIn(o).forEach((n) => out.add(n)); });
  return out;
}

/** Per top-level field, the most characters any one string in it may hold. */
function voiceBudget(content, example) {
  const out = {};
  for (const [k, v] of Object.entries(content)) {
    let max = 0;
    eachString(v, undefined, example?.[k], (o, _e, ex) => { max = Math.max(max, voiceLimit(o, ex)); });
    out[k] = max;
  }
  return out;
}

function allStrings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (isPlain(v)) Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}

const lintCount = (content) => allStrings(content).reduce((n, s) => n + lintText(s).length, 0);

/** One slide as the deck lint reads it: the title and the visible words. */
export function lintShape(content = {}) {
  const titleKey = ["title", "heading", "headline", "statement"].find((k) => typeof content[k] === "string" && content[k].trim());
  const texts = [];
  for (const [k, v] of Object.entries(content)) {
    if (k === titleKey || k === "notes" || VOICE_SKIP.has(k)) continue;
    for (const s of allStrings(v)) if (!fixedString(s)) texts.push(s);
  }
  return { title: titleKey ? content[titleKey] : undefined, texts };
}

/** The CLI sometimes answers {content:{content:{…}}}; descend while the
 *  original has no field called "content". */
function unwrapEdit(edit, original) {
  let e = edit;
  for (let d = 0; d < 4 && isPlain(e) && !("content" in original) && isPlain(e.content); d++) e = e.content;
  return e;
}

/** Shortest an edited prose string may become, as a share of its original. */
const VOICE_MIN_SHARE = 0.4;

/**
 * Why an edit is refused, or null when it may be applied.
 *
 * Figures are checked per string: an edited string may carry only the figures
 * that same original string carried — so a figure cannot move between fields
 * or list items (swapped values, reordered page numbers). A string that had no
 * figure may take one from `allowed` (the material); speaker notes may also
 * cite a figure the slide shows. A figure that was only in the notes never
 * reaches the visible slide.
 */
function voiceRejection(original, edit, example, allowed) {
  if (!sameShape(original, edit)) return "the edit changed the slide's structure";
  let reason = null;
  const visible = visibleFigures(original);
  eachString(original, edit, example, (o, e, ex, inNotes) => {
    if (reason || e === o) return;
    if (!fixedString(o) && !e.trim()) { reason = "the edit emptied a field"; return; }
    if (!fixedString(o) && e.trim().length < o.trim().length * VOICE_MIN_SHARE) { reason = "the edit cut a field to under 40% of its length"; return; }
    if (e.length > voiceLimit(o, ex)) { reason = "the edit was too long for the layout"; return; }
    const own = figuresIn(o);
    const pool = new Set([...own, ...(own.length ? [] : allowed), ...(inNotes ? visible : [])]);
    const added = untraceable([e], pool);
    if (added.length) reason = `the edit added figures not in the material: ${added.join(", ")}`;
  });
  if (reason) return reason;
  if (lintCount(edit) > lintCount(original)) return "the edit read worse in the voice check";
  return null;
}

const reasonText = (err) => String(err?.message || err || "unknown error").split("\n")[0].slice(0, 160);

/**
 * The voice pass: the provider edits every slide's words to the Nagarro voice
 * and the deck's register; each edit is checked here and applied only when it
 * keeps the slide's structure, fits the layout, adds no figure and reads no
 * worse. A refused edit keeps the slide's drafted wording, with a note; a
 * whole pass that leaves the deck reading worse (lintDeck) is undone. Never
 * fails the deck: an unavailable pass leaves one note and every slide as it was.
 *
 * Speaker notes are edited too, and may not gain a figure either. Only
 * `content` changes, so a hook slide keeps its role and theme.
 */
export async function runVoicePass(provider, slides, { register, allowed = new Set(), note = () => {}, sink, deadline } = {}) {
  const list = Array.isArray(slides) ? slides : [];
  if (!list.length) return list;
  // A provider without the method offers no voice pass (same posture as
  // analyzeOutline); one that has it but fails or answers null leaves a note.
  if (typeof provider?.editVoice !== "function") return list;
  if (Number.isFinite(deadline) && Date.now() > deadline - 60_000) {
    note("The voice pass was unavailable: the build is over its time budget. The slides keep their drafted wording.");
    return list;
  }
  sink?.emit?.({ stage: "voice", detail: "Polishing the voice" });

  // What is sent: each slide's words, without the system's chrome.
  const entries = [];
  list.forEach((s, index) => {
    if (!isPlain(s?.content)) return;
    const content = Object.fromEntries(Object.entries(s.content).filter(([k]) => !VOICE_SKIP.has(k)));
    if (!allStrings(content).some((t) => !fixedString(t))) return;
    const templateName = s.templateReference?.templateName || "";
    const example = findTemplate(templateName)?.example || {};
    entries.push({ index, templateName, content, budget: voiceBudget(content, example), example });
  });
  if (!entries.length) return list;

  // Batches whose prompts stay under VOICE_PROMPT_MAX.
  const rowSize = (e) => JSON.stringify({ index: e.index, template: e.templateName, budget: e.budget, content: e.content }).length + 1;
  const batches = [];
  let batch = [], size = VOICE_PROMPT_BASE;
  for (const e of entries) {
    const n = rowSize(e);
    if (VOICE_PROMPT_BASE + n >= VOICE_PROMPT_MAX) {
      note(`Slide ${e.index + 1} kept its original wording (too long to send for a voice edit).`);
      continue;
    }
    if (batch.length && size + n >= VOICE_PROMPT_MAX) { batches.push(batch); batch = []; size = VOICE_PROMPT_BASE; }
    batch.push(e); size += n;
  }
  if (batch.length) batches.push(batch);

  const tone = register || "thought";
  const results = await Promise.all(batches.map(async (b) => {
    try {
      const res = await provider.editVoice({
        register: tone,
        slides: b.map(({ index, templateName, content, budget }) => ({ index, templateName, content, budget })),
      });
      if (!res || !Array.isArray(res.slides)) return { batch: b, error: "no edit came back" };
      return { batch: b, edits: res.slides };
    } catch (err) {
      return { batch: b, error: reasonText(err) };
    }
  }));

  const failed = results.filter((r) => r.error);
  if (failed.length === results.length) {
    note(`The voice pass was unavailable (${failed[0].error}). The slides keep their drafted wording.`);
    return list;
  }
  for (const r of failed) {
    const ns = r.batch.map((e) => e.index + 1);
    note(`The voice pass was unavailable for slide${ns.length > 1 ? "s" : ""} ${ns.join(", ")} (${r.error}); they keep their drafted wording.`);
  }

  const out = [...list];
  const pending = [];
  for (const r of results) {
    if (r.error) continue;
    const byIndex = new Map(r.edits.filter((x) => x && Number.isInteger(x.index)).map((x) => [x.index, x.content]));
    for (const e of r.batch) {
      const n = e.index + 1;
      if (!byIndex.has(e.index)) { note(`Slide ${n} kept its original wording (no edit came back for it).`); continue; }
      const raw = unwrapEdit(byIndex.get(e.index), e.content);
      let reason = sameShape(e.content, raw) ? null : "the edit changed the slide's structure";
      const edit = reason ? null : keepFixed(e.content, raw);
      if (!reason) {
        reason = voiceRejection(e.content, edit, e.example, allowed);
      }
      if (reason) { note(`Slide ${n} kept its original wording (${reason}).`); continue; }
      if (JSON.stringify(edit) === JSON.stringify(e.content)) continue;
      out[e.index] = { ...list[e.index], content: { ...list[e.index].content, ...edit } };
      pending.push(n);
    }
  }

  /* Page numbers were set before this pass, from labels matching headings.
   * The label and the heading are edited independently, so either can drift
   * off the other; then the page points at nothing. Every contents entry that
   * matched a slide must still match that same slide, or the slides on both
   * ends (and any slide the label now matches first) keep their drafted
   * wording. Repeated, since undoing one slide can expose another pair. A
   * label reworded along with its heading still matches and is kept, which
   * is why labels are not simply frozen. */
  const linked = contentsLinks(list);
  for (let changed = true; changed && pending.length;) {
    changed = false;
    const now = contentsLinks(out);
    const undo = new Set();
    for (const [key, j] of linked) {
      if (j < 0 || now.get(key) === j) continue;
      undo.add(Number(key.split(":")[0])).add(j);
      if (now.get(key) >= 0) undo.add(now.get(key));
    }
    for (const x of [...undo].sort((a, b) => a - b)) {
      if (out[x] === list[x]) continue;
      out[x] = list[x];
      pending.splice(pending.indexOf(x + 1), 1);
      note(`Slide ${x + 1} kept its original wording (the edit broke the match between a contents entry and its slide).`);
      changed = true;
    }
  }

  // Deck budgets ("X, not Y", triads, "three" in titles, openers): an edit
  // set that makes the deck as a whole read worse is undone.
  if (pending.length) {
    const score = (deck) => lintDeck(deck.map((s) => lintShape(s?.content))).score;
    if (score(out) > score(list)) {
      note("The voice edit was undone: across the deck it read worse than the drafted wording (repeated contrasts, triads or openers).");
      return list;
    }
  }
  return out;
}

/**
 * The theme for one slide.
 *
 * The brand's structure is a sandwich: a dark title, light content, a dark
 * close. That was left entirely to the model, which meant it happened when the
 * model felt like it — of the decks on this machine, five open dark and six are
 * light from first slide to last. A deck that never goes dark does not look
 * like a deliberate choice; it looks like the feature is missing, which is
 * exactly what it was reported as.
 *
 * So the bookends are decided here and the middle is still the model's. It may
 * choose dark for a divider or a statement slide, and that is a judgement worth
 * having; whether the deck opens and closes on brand is not.
 *
 * Dark is still only ever applied to a template the audit verified
 * (js/dark-safe.json, written by tools/audit-dark-mode.mjs). 488 of 508 pass
 * as of 2026-10-13; the 20 that don't are illegible in light too (faded
 * numerals, fixed swatches). The check is what stops a future template that
 * paints its own light surface from landing on the cover.
 *
 * @param {number} index      0-based position
 * @param {number} total      slides in the deck
 * @param {{templateName: string, theme?: string}} pick
 * @returns {"dark"|undefined} undefined means "leave it light", the default
 */
export function themeFor(index, total, pick) {
  const name = pick?.templateName;
  if (!name || !DARK_SAFE.has(name)) return undefined;
  // A one- or two-slide deck has no middle, so it has no sandwich either.
  const isBookend = total >= 3 && (index === 0 || index === total - 1);
  return isBookend || pick.theme === "dark" ? "dark" : undefined;
}

/* ---- Which templates a generated slide becomes -----------------------------
 * These were hard-coded to the v1 names "title" and "slide-32". When the
 * library was replaced with the v2 Master Slides set both names disappeared,
 * and because nothing validated them, generation kept "succeeding" while
 * every slide it produced rendered blank — the failure was silent all the way
 * from the prompt to the viewer.
 *
 * They are still constants (one deliberate mapping, not a guess per slide),
 * but they are now verified at startup: an unknown name fails loudly, here,
 * instead of producing an empty deck. PptxImportService shares this mapping,
 * so the same check covers imported decks too. */
const COVER_TEMPLATE = "core/cover-single";
const CONTENT_TEMPLATE = "core/content-twocol";

for (const name of [COVER_TEMPLATE, CONTENT_TEMPLATE]) {
  if (!findTemplate(name)) {
    throw new Error(
      `generation-service: template "${name}" is not in the registry. ` +
      `Generated and imported decks map onto it, so this must name a real template ` +
      `(js/templates/index.js). Update COVER_TEMPLATE/CONTENT_TEMPLATE after a library change.`
    );
  }
}

/* ---- Drafting budgets ------------------------------------------------------
 * Each optional step has its own wall-clock budget, counted from when the step
 * starts — including any wait for a CLI slot, which the provider's own timeout
 * (90s / 60s) does not count. The outline call has no extra limit here: it
 * keeps the provider's own timeouts, so the optional steps can never eat into
 * the time the outline had before they existed. The approval-time build
 * deadline starts at approval and is unchanged. */
export const UNDERSTAND_STEP_MS = 120_000;
export const STORY_STEP_MS = 90_000;
const MAX_SLIDE_COUNT = 60;

class StepTimeoutError extends Error {
  constructor(step, ms) {
    super(`${step} took longer than ${describeMs(ms)}`);
    this.name = "StepTimeoutError";
    this.step = step;
  }
}

function describeMs(ms) {
  return ms >= 60_000 ? `${Math.round(ms / 60_000)} minute${ms >= 90_000 ? "s" : ""}` : `${Math.round(ms / 1000)} seconds`;
}

/** Settles with `promise`, or rejects with StepTimeoutError at `ms`. */
function withTimeout(promise, ms, step) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new StepTimeoutError(step, ms)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

/** Why a step was skipped, in a short phrase for the note. */
function reasonOf(err) {
  const message = String(err?.message || err || "unknown error").replace(/\s+/g, " ").trim();
  return message.length > 160 ? `${message.slice(0, 157)}…` : message;
}

/** A stated slide count: a whole number 1–60 (or its digits as a string);
 *  anything else ("you decide", "8-10", 0) means the engine chooses. */
export function cleanSlideCount(value) {
  const n = typeof value === "string" && /^\s*\d+\s*$/.test(value) ? Number(value) : value;
  return Number.isInteger(n) && n >= 1 && n <= MAX_SLIDE_COUNT ? n : null;
}

/** Distinct well-formed ids, in order. More than the per-deck limit is an
 *  error the caller sees (400), not a silent cut. */
function cleanReferenceIds(value) {
  if (!Array.isArray(value)) return [];
  const ids = [...new Set(value.filter((v) => typeof v === "string" && /^[\w-]{1,100}$/.test(v)))];
  if (ids.length > MAX_REFERENCES_PER_GENERATION) {
    throw new ReferenceValidationError(`A deck can use at most ${MAX_REFERENCES_PER_GENERATION} references.`);
  }
  return ids;
}

/** What understanding and the figure check read from a reference. */
const referenceMaterial = (r) => ({ id: r.id, name: r.name, text: r.text || "" });

/**
 * The hook is identified by its marker, not its position. If one was wanted
 * and the outline marked none, slide 2 (after the cover) is taken as the hook
 * so the layout step still treats it as one — on a deck of three or more; a
 * shorter deck has no room for it. If none was wanted, no slide keeps a mark.
 */
function markHook(mapping, wantsHook, notes) {
  if (!wantsHook) {
    for (const slide of mapping) if (slide?.role === "hook") delete slide.role;
    return;
  }
  if (mapping.length < 3) return;
  // The cover and the closing are never the hook (composition skips them), so
  // a mark there would be lost: it counts as no mark.
  const last = mapping.length - 1;
  const misplaced = [0, last].filter((i) => mapping[i]?.role === "hook");
  for (const i of misplaced) {
    const { role: _, ...rest } = mapping[i];
    mapping[i] = rest;
  }
  if (mapping.some((s) => s?.role === "hook")) return;
  mapping[1] = { ...mapping[1], role: "hook" };
  notes.push(misplaced.length
    ? `The outline marked ${misplaced[0] === 0 ? "the cover" : "the closing slide"} as the hook, so slide 2 is treated as the hook.`
    : "The outline did not mark a hook slide, so slide 2 is treated as the hook.");
}

export class GenerationNotFoundError extends Error {
  constructor(id) {
    super(`Generation ${id} not found.`);
    this.name = "GenerationNotFoundError";
  }
}

export class GenerationNotApprovableError extends Error {
  /* `presentationId` matters when the reason is "already approved": the deck
   * exists, and without it the client that retried had no way to reach it and
   * simply dead-ended on the error. */
  constructor(id, status, presentationId = null) {
    super(
      presentationId
        ? `Generation ${id} was already approved — its presentation already exists.`
        : `Generation ${id} cannot be approved from status "${status}".`
    );
    this.name = "GenerationNotApprovableError";
    this.status = status;
    this.presentationId = presentationId;
  }
}

/** Workspace isolation, identical posture to every other Service in this
 * codebase (see PresentationService.assertVisible, ExportService's
 * assertJobVisible) — a Generation belonging to another workspace is
 * reported as not-found, never forbidden. */
function assertVisible(record, context, id) {
  if (!record || record.workspaceId !== context.workspaceId) {
    throw new GenerationNotFoundError(id);
  }
  return record;
}

export class GenerationService {
  /**
   * @param {import("../infrastructure/ai/ai-provider.js").AIProvider} provider
   * @param {{understandStepMs?: number, storyStepMs?: number, references?: {get: Function, getMany: Function}}} [options] -
   *   budgets for the optional drafting steps (tests shorten them), and the
   *   reference reader (defaults to a ReferenceService)
   */
  constructor(provider, { understandStepMs = UNDERSTAND_STEP_MS, storyStepMs = STORY_STEP_MS, references = null } = {}) {
    if (!provider) throw new Error("GenerationService requires an AIProvider.");
    this.provider = provider;
    // Reads attached references by id, workspace-scoped (tests pass a stub).
    this.references = references || new ReferenceService(provider);
    this.understandStepMs = understandStepMs;
    this.storyStepMs = storyStepMs;
  }

  /**
   * Backs POST /api/generations.
   *
   * Drafting is three steps: understand the content (a brief), plan the story
   * (an arc and, if wanted, a hook), then write the outline from both. The
   * first two are help, not requirements — either failing (an error, its
   * timeout, a session limit) leaves a note on the record and the outline is
   * drafted without it, exactly as it was before they existed. Only the
   * outline failing fails the generation.
   *
   * `background: true` returns the `pending` record at once and drafts after
   * the response, writing `progress` frames ({stage, detail}) a client can
   * poll — the three steps together are longer than a request should be held
   * open. Without it the same work runs inside the request (tools, tests).
   *
   * @param {{userId, workspaceId, role}} context
   * @param {{prompt: string, coaching?: object, answers?: object, wantsHook?: boolean,
   *   slideCount?: number|string|null, referenceIds?: string[], background?: boolean}} params
   */
  async requestGeneration(context, {
    prompt, coaching, answers, wantsHook = true, slideCount = null, referenceIds = [], background = false,
  } = {}) {
    if (typeof prompt !== "string" || !prompt.trim()) {
      throw new Error("prompt is required.");
    }
    /* Resolved before anything is stored, so too many ids (400) or one this
     * workspace cannot see (404) fails the request itself. Only the ids are
     * kept on the record; the text is read again by id at approval, since a
     * reference can be 60k characters and the record is rewritten often. */
    const ids = cleanReferenceIds(referenceIds);
    const references = (await this.references.getMany(context, ids)).map(referenceMaterial);

    const record = await generationRepository.insert({
      workspaceId: context.workspaceId,
      userId: context.userId,
      prompt,
      // What the prompt coach asked and was told, for later analysis.
      coaching: sanitizeCoaching(coaching),
      // The answers themselves are also folded into `prompt`; kept apart here
      // so content understanding can say a fact came from an answer.
      answers: sanitizeAnswers(answers),
      wantsHook: wantsHook !== false,
      slideCount: cleanSlideCount(slideCount),
      referenceIds: ids,
    });

    if (background === true) {
      // Deliberately not awaited, as with approval: #draft never throws and
      // always leaves the record at `completed` or `failed`.
      this.#draft(record, references);
      return record;
    }
    return this.#draft(record, references);
  }

  /**
   * Understand → story → outline for one pending record. Never throws: every
   * path ends in a `completed` or `failed` write, whose record it returns.
   * Only the optional steps are time-boxed here; the outline keeps the
   * provider's own timeouts. The approval-time build deadline is separate and
   * starts later, at approval.
   */
  async #draft(record, references = []) {
    const id = record.id;
    const notes = [];
    const progress = (stage, detail) =>
      generationRepository.updateStatus(id, { progress: { stage, detail, updatedAt: new Date().toISOString() } }).catch(() => {});
    const { prompt, answers, wantsHook, slideCount } = record;

    try {
      // ---- 1. Understand the content ------------------------------------
      let brief = null;
      await progress("understanding", "Understanding the content");
      if (typeof this.provider.understandContent !== "function") {
        notes.push("Content understanding was unavailable: this AI provider does not offer it. The outline was drafted from the prompt alone.");
      } else {
        try {
          // The provider budgets the references' text into its own prompt.
          brief = normalizeBrief(await withTimeout(
            this.provider.understandContent({ prompt, answers, references }),
            this.understandStepMs,
            "Content understanding"
          ));
          if (!brief) notes.push("Content understanding was unavailable: the reading came back empty. The outline was drafted from the prompt alone.");
        } catch (err) {
          notes.push(`Content understanding was unavailable (${reasonOf(err)}). The outline was drafted from the prompt alone.`);
        }
      }

      // ---- 2. Plan the story (needs a brief) ----------------------------
      let story = null;
      if (brief) {
        await progress("story", "Shaping the story");
        if (typeof this.provider.planStory !== "function") {
          notes.push("Story planning was unavailable: this AI provider does not offer it. The outline was drafted from the content brief alone.");
        } else {
          try {
            story = await withTimeout(
              this.provider.planStory({ brief, wantsHook, slideCount }),
              this.storyStepMs,
              "Story planning"
            );
            if (!story) notes.push("Story planning was unavailable: no story came back. The outline was drafted from the content brief alone.");
          } catch (err) {
            notes.push(`Story planning was unavailable (${reasonOf(err)}). The outline was drafted from the content brief alone.`);
          }
        }
      }
      if (brief || story) {
        await generationRepository.updateStatus(id, { brief, story, notes: [...notes] }).catch(() => {});
      }

      // ---- 3. Draft the outline -----------------------------------------
      await progress("drafting", "Drafting the outline");
      const register = brief?.register || null;
      // No limit of its own: the provider's timeouts apply, as before.
      const outline = (withContext) => this.provider.generatePresentation({
        prompt,
        brief: withContext ? brief : null,
        story: withContext ? story : null,
        register,
        wantsHook,
        slideCount,
      });
      let result;
      try {
        result = await outline(true);
      } catch (err) {
        // The brief and story make the outline request longer; a prompt that
        // only just fitted on its own can be pushed over. Once, without them.
        // Matched on the provider's own wording ("That request is too long"),
        // not just "too long" — "The AI took too long to respond" is a timeout.
        if (!(brief || story) || !/request is too long/i.test(err?.message || "")) throw err;
        notes.push("The outline was drafted without the content brief and story: with them the request was too long.");
        result = await outline(false);
      }

      const proposedMapping = Array.isArray(result?.proposedMapping) ? result.proposedMapping : [];
      markHook(proposedMapping, wantsHook, notes);

      return await generationRepository.updateStatus(id, {
        status: "completed",
        proposedMapping,
        confidencePerSlide: result.confidencePerSlide,
        output: { ...result, proposedMapping },
        usage: result.usage,
        notes,
        progress: null,
      });
    } catch (err) {
      // A provider failure is a legitimate, expected outcome, not an
      // exception the caller has to catch — the same posture Export Job
      // already establishes for a failed render (Job → Failed, prior state
      // never destroyed). The route always gets back a Generation record;
      // its status field tells the real story. With a real (fallible)
      // provider, err.message is the only way the caller learns why.
      const error = err?.message || String(err);
      return generationRepository
        .updateStatus(id, { status: "failed", error, notes, progress: null })
        .catch((writeErr) => {
          console.error(`[generate] could not record failure for ${id}: ${writeErr.message}`);
          return null;
        });
    }
  }

  /** Backs GET /api/generations/:id. */
  async getGeneration(context, id) {
    const record = await generationRepository.findById(id);
    return assertVisible(record, context, id);
  }

  /**
   * Backs PATCH /api/generations/:id — editing the outline before it is built.
   *
   * The status machine always allowed this window (a generation sits at
   * `completed` until someone approves it) but nothing could write to it, so
   * the UI approved immediately and a wrong narrative was only discovered after
   * two to four minutes of composition. Correcting a title here costs nothing.
   *
   * Only the outline is writable, and only while it is still unapproved.
   */
  async updateOutline(context, id, proposedMapping) {
    const record = assertVisible(await generationRepository.findById(id), context, id);
    if (record.status !== "completed") {
      throw new GenerationNotApprovableError(id, record.status, record.presentationId || null);
    }
    if (!Array.isArray(proposedMapping) || !proposedMapping.length) {
      throw new Error("proposedMapping must be a non-empty array.");
    }

    /* Rebuilt from the caller's values rather than merged, so the client cannot
     * introduce fields the composer does not expect — the outline is only ever
     * a title and some body text. */
    /* Looked up by the ORIGINAL slide number, not the array index: the
     * outline editor lets a user remove a slide before building, which
     * renumbers everything after it with no memory of original position.
     * Keying by index silently handed every slide after a removal the
     * previous occupant's images/tables/elements. `sourceSlide` is the
     * client's own claim about which original slide a row came from — it is
     * used only as a lookup key into the server's own record, never as a
     * source of content, so a forged value just finds nothing (or the wrong
     * slide's own already-trusted data) rather than any new capability. */
    const bySource = new Map((record.proposedMapping || []).map((s) => [s.slideNumber, s]));
    const cleaned = proposedMapping.map((slide, i) => {
      const body = Array.isArray(slide?.content?.body)
        ? slide.content.body.map((b) => String(b ?? "")).filter((b) => b.trim())
        : slide?.content?.body ? [String(slide.content.body)] : [];
      const key = Number(slide?.sourceSlide);
      const own = (Number.isInteger(key) && key > 0 && bySource.get(key)) || {};
      return {
        slideNumber: i + 1,
        title: String(slide?.title ?? "").slice(0, 300),
        content: {
          body,
          notes: String(slide?.content?.notes ?? ""),
          ...(own.content?.images?.length ? { images: own.content.images } : {}),
          ...(own.content?.tables?.length ? { tables: own.content.tables } : {}),
        },
        ...(own.elements ? { elements: own.elements } : {}),
        // The hook is a marker the layout step reads; server data, like images.
        ...(own.role === "hook" ? { role: "hook" } : {}),
      };
    }).filter((s) => s.title.trim() || s.content.body.length);

    if (!cleaned.length) throw new Error("An outline needs at least one slide with content.");

    return generationRepository.updateStatus(id, {
      proposedMapping: cleaned,
      // analyzeOutlineForCompose reuses a cached `analysis` keyed by 1-based
      // slide position (see its own comment: "a retried approval shouldn't
      // pay for it twice"). An outline edit can reorder, remove or retitle
      // slides, so a cached analysis keyed to the OLD positions/content is
      // now describing the wrong slides — invalidated here rather than left
      // to silently mislabel whatever ends up at each position next.
      analysis: null,
      output: { ...(record.output || {}), slides: cleaned },
    });
  }

  /**
   * Backs POST /api/generations/:id/approve.
   *
   * ASYNCHRONOUS. It claims the generation and returns immediately; composition
   * then runs in the background and the client polls GET /api/generations/:id.
   *
   * It used to compose inline, inside the request. That took 130–260 seconds
   * for a real deck while the browser's own fetch aborts at 150 — so the user
   * saw "the server is taking too long", the server finished anyway, and the
   * Retry button offered next walked straight into a duplicate. Composition is
   * simply longer than an HTTP request should be held open.
   *
   * @param {{userId, workspaceId, role}} context
   * @param {string} id
   * @returns {Promise<object>} the claimed generation record, status "approving"
   */
  async approveGeneration(context, id) {
    const record = assertVisible(await generationRepository.findById(id), context, id);

    if (record.status !== "completed") {
      throw new GenerationNotApprovableError(id, record.status, record.presentationId || null);
    }

    /* Claim BEFORE composing. Claiming afterwards left the whole multi-minute
     * composition between "we checked the status" and "we wrote it", so two
     * approvals both read `completed` and both created a deck. The status write
     * runs inside the repository's file lock and same-status writes are now
     * validated, so this is the one genuinely atomic point available. */
    let claimed;
    try {
      claimed = await generationRepository.updateStatus(id, { status: "approving", error: null });
    } catch (err) {
      if (err instanceof InvalidGenerationTransitionError) {
        // Someone else won the claim between our read and our write. Re-read so
        // we can hand back the deck they created rather than a bare conflict.
        const now = await generationRepository.findById(id).catch(() => null);
        throw new GenerationNotApprovableError(id, now?.status || record.status, now?.presentationId || null);
      }
      throw err;
    }

    // Deliberately not awaited: the response goes back now. Every failure path
    // inside releases the claim, so the record can never be stranded by a
    // rejection here.
    this.#composeInBackground(context, record);

    return claimed;
  }

  /**
   * The record's references, read again by id for composition: their text for
   * the figure check, and the images marked `useOnSlides` copied into the
   * served uploads (reference images live outside the served tree) for the
   * photo slots. A reference deleted since drafting, or an image that cannot
   * be copied, is skipped with a warning; the build goes on without it.
   */
  async #referencesForCompose(context, record, warnings) {
    const references = [];
    const authorImages = [];
    for (const id of record.referenceIds || []) {
      let ref;
      try {
        ref = await this.references.get(context, id);
      } catch {
        warnings.push("A reference attached to this deck is no longer available, so it was not used.");
        continue;
      }
      references.push(referenceMaterial(ref));
      if (!ref.useOnSlides || !ref.imagePath) continue;
      try {
        const stored = await storeImportedImage(await readFile(ref.imagePath));
        if (stored) authorImages.push(stored.path);
        else warnings.push(`The image "${ref.name}" could not be placed on a slide.`);
      } catch (err) {
        console.warn(`[generation] could not copy reference image ${id}: ${err.message}`);
        warnings.push(`The image "${ref.name}" could not be placed on a slide.`);
      }
    }
    return { references, authorImages };
  }

  /** The work approveGeneration() used to do inline. Never throws. */
  async #composeInBackground(context, record) {
    const id = record.id;
    /* Throttled so a fast batch loop (many slides, small prompts) cannot turn
     * every progress tick into a repository write — the record only needs to
     * be fresh enough for a poller to see, not every single emission. The
     * final "done" write below is deliberately NOT throttled: without it, a
     * build that finished inside the throttle window could leave the record
     * showing its last mid-build stage forever. */
    let lastWrite = 0;
    const onProgress = (progress) => {
      const now = Date.now();
      if (now - lastWrite < 1000) return;
      lastWrite = now;
      generationRepository.updateStatus(id, { progress }).catch(() => {});
    };
    // The content-understanding pass is expensive enough to be worth caching:
    // a re-approve (retry after a stranded claim, an edit-then-approve loop)
    // reuses whatever analysis already ran rather than paying for it again.
    // Storing a freshly computed one is fire-and-forget, same posture as
    // progress above — composition must never wait on, or fail because of,
    // a write that only matters for the NEXT attempt.
    const onAnalysis = (analysis) => {
      if (!analysis) return;
      generationRepository.updateStatus(id, { analysis }).catch(() => {});
    };
    // Whole-build soft deadline: ~10 minutes is the budget this build is
    // expected to fit in (see deck-build.js's POLL_MAX_ATTEMPTS, sized to
    // outlast it). Nine minutes here, not ten — the two optional passes that
    // check it (planning, visual review) need to see it coming before the
    // essential passes (analysis, template choice, content fill) eat the
    // whole budget themselves and leave no time to notice. Those essential
    // passes are never deadline-gated: a slow analysis pass finishing late is
    // still a deck; a plan or a review pass starting with a minute left is
    // not worth the risk of running the WHOLE build over its budget for an
    // enhancement.
    const deadline = Date.now() + 9 * 60_000;
    try {
      const warnings = [];
      const stats = {};
      const { references, authorImages } = await this.#referencesForCompose(context, record, warnings);
      const slides = await composeSlides(this.provider, record.proposedMapping, {
        title: record.output?.title || record.prompt,
        subtitle: record.output?.subtitle,
        warnings,
        origin: record.origin,
        imageSource: record.imageSource || "source",
        onProgress,
        analysis: record.analysis || null,
        onAnalysis,
        deadline,
        stats,
        // A count in the prompt, or the coach's length answer (stored on the
        // record, never folded into the prompt). The record keeps only the
        // number, so a range pill (8–10 → 9) cannot be told from a typed 9:
        // both count as exact, which errs toward the length the user chose.
        exactCount: requestedSlideCount(record.prompt) != null || record.slideCount != null,
        // The deck's figures come only from here (coach answers are already
        // part of the prompt).
        prompt: record.prompt || "",
        brief: record.brief || null,
        references,
        authorImages,
      });
      // A slide on the plain default layout is a visible failure, so it is
      // counted, named, and carried to the deck (it used to read as "done").
      const fallbackNumbers = new Set(stats.fallback || []);
      const totalSlides = (record.proposedMapping || []).length;
      // Prepended, not appended: composeWarnings is capped to 12 below, and a
      // parse-time warning (e.g. "an image could not be read") is about the
      // SOURCE file — it matters at least as much as a compose-time one, and
      // being appended meant a deck with 12+ compose warnings dropped every
      // parse warning off the end of the array before the cap ever saw them.
      if (Array.isArray(record.output?.warnings)) warnings.unshift(...record.output.warnings);
      // Drafting's notes ("Content understanding was unavailable (…)") say
      // why a deck degraded before composition began; they go ahead of it.
      if (Array.isArray(record.notes)) warnings.unshift(...record.notes.filter((n) => typeof n === "string" && n));
      // The layout summary goes first of all, so the cap can never cut it.
      if (fallbackNumbers.size) {
        warnings.unshift(`${fallbackNumbers.size} of ${totalSlides} slides kept the default layout (slide ${[...fallbackNumbers].join(", ")}).`);
      }
      const presentation = await presentationService.createPresentation(context, {
        title: record.output?.title || record.prompt,
        slides,
        status: "Generated",
        // The generation knows which path made it (prompt vs .pptx import) —
        // the deck carries that origin forward for the UI's row markers.
        origin: record.origin,
        layoutFallback: fallbackNumbers.size ? { count: fallbackNumbers.size, total: totalSlides } : null,
      });
      /* Status and link in ONE write. Splitting them left a window where the
       * record read `approved` with a null presentationId, so a poller — the
       * client is one — could see a finished generation pointing at no deck. */
      await generationRepository.updateStatus(id, {
        status: "approved",
        presentationId: presentation.id,
        // Persisted so the UI can say the deck is not what the engine intended.
        composeWarnings: [...new Set(warnings)].slice(0, 12),
        layoutFallback: { count: fallbackNumbers.size, total: totalSlides },
        progress: (() => {
          // Same {n, title, state} shape composeSlides emitted throughout —
          // built from the mapping (not the presentation-shaped `slides`
          // above, which no longer carries a slide number) so the final frame
          // stays internally consistent with every frame before it: `done`
          // and `total` count the same mapping entries `slides` lists, all
          // landed on "done". A source slide can split into more than one
          // OUTPUT slide, so the actual produced count is carried separately
          // as `outputSlides` rather than overloading `total` with a second
          // meaning.
          const mappingSlides = (record.proposedMapping || []).map((s) => ({
            n: s.slideNumber,
            title: s.title,
            state: fallbackNumbers.has(s.slideNumber) ? "fallback" : "done",
          }));
          return {
            stage: "done", detail: "",
            done: mappingSlides.length, total: mappingSlides.length,
            outputSlides: slides.length,
            slides: mappingSlides,
            updatedAt: new Date().toISOString(),
          };
        })(),
      });
    } catch (err) {
      // Release the claim so the user can retry, and keep the reason: it is the
      // only place this failure is visible, since nobody is awaiting us. The
      // stale mid-build progress is cleared too — a retried build starts its
      // own timeline, not the failed one's last frame.
      await generationRepository
        .updateStatus(id, { status: "completed", error: err.message, progress: null })
        .catch(() => {});
      console.error(`[generation] approving ${id} failed: ${err.message}`);
    }
  }
}

/**
 * proposedMapping is placeholder content ({title, content: {title, body,
 * notes}} per slide — `body` a string or a string[]) — not template-shaped.
 * This is the one place that decides which registered template each
 * generated slide becomes; Decision 1 fixes the mapping to exactly two
 * existing templates. Exported (MVP Sprint 1) so PptxImportService reuses
 * this exact mapping for imported slides too, rather than a second,
 * parallel one — one slide-mapping code path for every content source.
 * `notes` (MVP Sprint 1: real AI + PPTX speaker notes) rides along in
 * content — not rendered by either template, but preserved on the slide so
 * it survives into the Editor/export rather than being silently dropped.
 */

/**
 * Clears approval claims left behind by a process that died mid-composition.
 *
 * The claim is durable on purpose — that is what makes it exclude a second
 * approval — but it means a crash, or a plain Ctrl-C, between claiming and
 * finishing leaves a record reading `approving` forever with nobody left to
 * move it, and the user can never retry.
 *
 * Safe to run at boot because approval is not resumable: composition has no
 * checkpoints, so the only correct recovery is to put the generation back and
 * let the user ask again.
 *
 * @returns {Promise<number>} how many claims were released
 */
export async function releaseStrandedApprovals() {
  const all = await generationRepository.findAll();
  let released = 0;
  for (const record of all.filter((g) => g.status === "approving")) {
    try {
      await generationRepository.updateStatus(record.id, {
        status: "completed",
        error: "Approval was interrupted when the app stopped. Try again.",
      });
      released++;
    } catch {
      // One bad record must not stop the sweep.
    }
  }
  // Background drafting holds a record at `pending` the same way; at boot no
  // draft can still be running, so one left there was interrupted.
  for (const record of all.filter((g) => g.status === "pending")) {
    try {
      await generationRepository.updateStatus(record.id, {
        status: "failed",
        error: "Drafting was interrupted when the app stopped. Try again.",
        progress: null,
      });
      released++;
    } catch {
      // One bad record must not stop the sweep.
    }
  }
  return released;
}

/** Builds the tick() sink composition threads through. Mirrors note(): callers
 *  that pass nothing get a no-op; emitting can never fail the build. */
function progressSink(onProgress, mapping) {
  const slides = mapping.map((s) => ({ n: s.slideNumber, title: s.title, state: "pending" }));
  const emit = (patch) => {
    try {
      // `slides` is mutated in place by setStates() as the build progresses,
      // so a live reference here would let every LATER mutation retroactively
      // rewrite every EARLIER patch a caller is holding onto — a repository
      // write survives that (it serializes immediately), but any in-memory
      // observer (a poller reading the same object twice, a test collecting
      // patches) would see its own history keep changing underneath it, and
      // an already-emitted "writing" patch would silently read back "done".
      // Snapshotting each slide here is what makes a patch actually mean what
      // it said at the moment it was emitted.
      onProgress?.({ slides: slides.map((s) => ({ ...s })), ...patch, updatedAt: new Date().toISOString() });
    } catch { /* never fatal */ }
  };
  const setStates = (numbers, state) => {
    for (const s of slides) if (numbers.includes(s.n)) s.state = state;
  };
  return { emit, setStates };
}

/**
 * Whether the visual review loop (slide-review-service.js) actually runs.
 * ON by default — a feature nobody enables never gets used, and
 * `reviewSlides` was built specifically so this could be the default: every
 * one of its guards (Playwright missing, the capture page unreachable, the
 * pass running long) degrades to `note("Visual review skipped: …")` and the
 * slides passing through unchanged, never to a failed or hung deck. That is
 * what makes ON-by-default safe for a CI box or a dev machine with no
 * Chromium install — the same posture as every other enhancement pass in
 * this file (`analyzeOutline`, `planDeck`): present when it can run, silently
 * absent when it can't, but never a requirement.
 *
 * Set NPS_VISUAL_REVIEW=0 (the exact string "0") to disable — the escape
 * hatch, not the default. Tests that exercise `#composeInBackground` or
 * either compose path end-to-end set this in their own setup so the suite
 * stays Playwright-free and deterministic; that is a test-speed decision,
 * not a statement that review is unsafe to run.
 */
function visualReviewEnabled() {
  return process.env.NPS_VISUAL_REVIEW !== "0";
}

/** Strips the `__shortlist` composition-scratch field every built slide in
 *  both compose paths carries (see the field's own comment at each push
 *  site). Unconditional, and the LAST thing either compose path does before
 *  returning — whether or not the visual review pass actually ran, this
 *  field must never reach a caller that might persist it. `reviewSlides`
 *  strips its own working copies for the same reason internally; this call
 *  is what guarantees the invariant even when review is disabled and
 *  `reviewSlides` never runs at all. */
function stripShortlists(slides) {
  return (slides || []).map((s) => {
    if (!s || typeof s !== "object" || !("__shortlist" in s)) return s;
    const { __shortlist, ...rest } = s;
    return rest;
  });
}

/** Hooked into both compose paths, immediately before each returns its final
 *  slide array (after divider insertion/reindexing, so the review measures
 *  the ACTUAL deck, not an intermediate shape). Review itself is skipped
 *  when `visualReviewEnabled()` is false, but `__shortlist` is stripped
 *  either way — see `stripShortlists`.
 *
 *  Also skipped once the whole build's soft `deadline` (#composeInBackground)
 *  is within a minute of passing: review is a Playwright pass with its own
 *  180s hard timeout (slide-review-service.js), and starting one with under
 *  a minute of budget left is how an enhancement ends up costing the build
 *  its own deadline instead of just skipping itself. The essential passes
 *  (analysis, template choice, content fill) already ran by the time this is
 *  reached — this only ever trims the optional tail. */
async function runVisualReview(finalSlides, { title, note, sink, deadline }) {
  if (!visualReviewEnabled()) return stripShortlists(finalSlides);
  if (Number.isFinite(deadline) && Date.now() > deadline - 60_000) {
    note("Visual review skipped — the build is over its time budget.");
    return stripShortlists(finalSlides);
  }
  const reviewed = await reviewSlides(finalSlides, { title, note, tick: (patch) => sink?.emit(patch) });
  return stripShortlists(reviewed);
}

/**
 * The content-understanding pass: what IS each slide, beyond what the regex
 * signature already caught? Runs once, before either compose path builds its
 * signatures, so both paths score templates against the model's read of the
 * content as well as the pattern-matched one.
 *
 * A cached analysis (`opts.analysis`, read from the generation record) is
 * reused rather than re-run — the pass is a real model call, and a retried
 * approval shouldn't pay for it twice. A freshly computed one is handed back
 * through `onAnalysis` so the caller can persist it; this function never
 * writes to storage itself.
 *
 * Never blocks or fails the build: a missing `analyzeOutline` on the
 * provider, or the call throwing, both leave `analysisByN` empty and the
 * build proceeds on the regex floor alone — exactly as it did before this
 * pass existed. The only observable difference is one `note()`.
 *
 * @returns {Promise<Map<number, object>>} 1-based slide number -> analysis entry
 */
async function analyzeOutlineForCompose(provider, mapping, { title, analysis, onAnalysis, note, sink }) {
  let a = analysis || null;
  if (!a && typeof provider?.analyzeOutline === "function") {
    const outline = mapping.map((s) => ({
      title: s.title,
      bullets: bulletsOf(s),
      tables: s.content?.tables || [],
      elements: s.elements || {},
    }));
    sink.setStates(mapping.map((s) => s.slideNumber), "analyzing");
    sink.emit({ stage: "analyzing", detail: "Analyzing content" });
    try {
      a = await provider.analyzeOutline({
        title,
        outline,
        onBatch: (b) => {
          // b.slideNumbers is 1-based positions in `outline` (== `mapping`,
          // built 1:1 from it above), matching the onBatch convention every
          // other pass here already uses.
          const numbers = (b.slideNumbers || []).map((i) => mapping[i - 1]?.slideNumber).filter(Boolean);
          sink.setStates(numbers, "analyzing");
          sink.emit({
            stage: "analyzing",
            detail: `Analyzing slide${numbers.length > 1 ? "s" : ""} ${numbers.join(", ")}`,
            done: b.index,
            total: b.total,
          });
        },
      });
      for (const w of a?.warnings || []) note(w);
      onAnalysis?.(a);
    } catch (err) {
      // An enhancement, not a requirement — the regex signature is the floor
      // and is always present. Never silent, though: the same lesson every
      // other catch in this file already learned the hard way.
      console.warn(`[generation] content analysis failed, using regex signatures only: ${err.message}`);
      note(`Content analysis was unavailable: ${err.message}`);
      a = null;
    }
  }
  return new Map((a?.slides || []).map((s) => [s.n, s]));
}

/** Templates that can open a chapter break. Filtered once at module scope —
 *  planDeck's own divider-picking never needs to re-scan the full library. */
const DIVIDER_TEMPLATES = liveTemplates.filter((t) => t.role === "divider");

/**
 * Drops the parts of a raw planDeck() result that don't hold up, each with
 * its own warning — a garbled `dark` array must not cost the deck its
 * `sections`, so every part is validated independently rather than the whole
 * plan being accepted or rejected as one unit.
 *
 * @param {object} raw    the provider's `plan` field, untrusted
 * @param {number} total  slide count the indexes must fall within (1..total)
 * @param {(msg: string) => void} note
 * @returns {null|{sections, dark:number[], emphasis:number[], pace:object, dividers:Array<{after,title}>}}
 */
function validatePlan(raw, total, note) {
  if (!raw || typeof raw !== "object") return null;
  const inRange = (n) => Number.isInteger(n) && n >= 1 && n <= total;

  const dark = (Array.isArray(raw.dark) ? raw.dark : []).filter((n) => {
    if (inRange(n)) return true;
    note(`Deck plan: dark slide ${JSON.stringify(n)} is out of range and was dropped.`);
    return false;
  });
  const emphasis = (Array.isArray(raw.emphasis) ? raw.emphasis : []).filter((n) => {
    if (inRange(n)) return true;
    note(`Deck plan: emphasis slide ${JSON.stringify(n)} is out of range and was dropped.`);
    return false;
  });
  const sections = (Array.isArray(raw.sections) ? raw.sections : []).filter((s) => {
    const ok = s && inRange(s.from) && inRange(s.to) && s.from <= s.to && typeof s.title === "string" && s.title.trim();
    if (!ok) note("Deck plan: an invalid section entry was dropped.");
    return ok;
  });
  const rawPace = raw.pace && typeof raw.pace === "object" ? raw.pace : {};
  const pace = {};
  for (const [k, v] of Object.entries(rawPace)) {
    if (inRange(Number(k)) && (v === "dense" || v === "breather")) pace[k] = v;
  }
  let dividers = (Array.isArray(raw.dividers) ? raw.dividers : []).filter((d) => {
    // after === total would insert the divider AFTER the last slide — the
    // divider becomes the closing slide, which is never a chapter break, it's
    // a broken deck ending. Rejected the same way an out-of-range index is.
    const ok = d && inRange(d.after) && d.after < total && typeof d.title === "string" && d.title.trim();
    if (!ok) note(`Deck plan: divider after slide ${JSON.stringify(d?.after)} is out of range and was dropped.`);
    return ok;
  });
  // No more than one divider for every six slides — a plan that wants a break
  // between nearly every pair of slides is not chapters, it's noise.
  const maxDividers = Math.floor(total / 6);
  if (dividers.length > maxDividers) {
    note(`Deck plan: ${dividers.length} dividers proposed but only ${maxDividers} allowed for a ${total}-slide deck — the extras were dropped.`);
    dividers = dividers.slice(0, maxDividers);
  }
  return { sections, dark, emphasis, pace, dividers };
}

/**
 * The deck-level art-direction pass: given the whole outline (and whatever
 * per-slide analysis already ran), decide the deck's STRUCTURE — where its
 * chapters break, which slide(s) deserve dark emphasis, which one is the
 * single strongest claim, and where the pacing should breathe. Runs once,
 * after analyzeOutlineForCompose and before either compose path builds
 * shortlists, so both paths can steer template choice with it.
 *
 * Never blocks or fails the build: a provider with no planDeck, or a call
 * that throws, both leave `plan` null and the build proceeds exactly as it
 * did before this pass existed — only a note() marks the difference.
 *
 * Also skipped once the whole build's soft `deadline` is within a minute of
 * passing — same reasoning as runVisualReview's own guard just below: this
 * is a single, real model call, not the essential choose/fill work, and a
 * plan built with no time left to use it is worth skipping rather than
 * risking the build's own deadline for it.
 *
 * @returns {Promise<null|ReturnType<typeof validatePlan>>}
 */
async function planDeckForCompose(provider, mapping, { title, analysisByN, note, sink, deadline }) {
  if (typeof provider?.planDeck !== "function") return null;
  if (Number.isFinite(deadline) && Date.now() > deadline - 60_000) {
    note("Deck planning skipped — the build is over its time budget.");
    return null;
  }
  const outline = mapping.map((s) => ({
    title: s.title,
    bullets: bulletsOf(s),
  }));
  sink.emit({ stage: "planning", detail: "Planning deck structure" });
  try {
    const analysis = { slides: mapping.map((s) => analysisByN.get(s.slideNumber)).filter(Boolean) };
    const result = await provider.planDeck({ title, outline, analysis });
    const plan = validatePlan(result?.plan, mapping.length, note);
    for (const w of result?.warnings || []) note(w);
    sink.emit({
      stage: "planning",
      detail: plan?.sections?.length
        ? `Sections: ${plan.sections.map((s) => s.title).join(", ")}`
        : "Deck plan complete",
    });
    return plan;
  } catch (err) {
    // An enhancement, not a requirement — composition proceeds exactly as it
    // did before planDeck existed. Never silent: the same lesson every other
    // degrade-gracefully catch in this file already learned.
    console.warn(`[generation] deck planning failed, composing without a plan: ${err.message}`);
    note(`Deck planning was unavailable: ${err.message}`);
    return null;
  }
}

/** Applies plan.emphasis to a signatures array: the flagged slides read as a
 *  single strong assertion regardless of what the regex/analysis signature
 *  already said — the deck plan is a judgement about the WHOLE deck's
 *  narrative that a per-slide signature has no way to make on its own. */
function applyEmphasis(signatures, plan) {
  if (!plan?.emphasis?.length) return signatures;
  const set = new Set(plan.emphasis);
  return signatures.map((sig, i) => (set.has(i + 1) ? { ...sig, isAssertion: true } : sig));
}

/** The template shortlist's `boostRoles` for one slide, given the plan —
 *  empty when the slide isn't flagged, so a plain spread stays a no-op.
 *  `["statement", "quote"]` is deliberate, not an arbitrary pair: a
 *  fullbleed layout for this slide already gets boosted via the signature's
 *  own `isAssertion`/`wants` scoring (applyEmphasis, above), while a quote
 *  layout has no such signal of its own and carries a single strong claim
 *  better than a raw fullbleed slide would — so quote needs the explicit
 *  boost here and fullbleed doesn't. */
function emphasisBoost(plan, sourceN) {
  return plan?.emphasis?.includes(sourceN) ? { boostRoles: ["statement", "quote"] } : {};
}

/** The plan's dark/light verdict for one slide, falling back to the model's
 *  own per-slide theme choice when there is no plan at all — OR when the
 *  plan exists but its `dark` list came back empty. A non-empty `dark` is a
 *  deliberate deck-level opinion, and once one exists it is the authority
 *  over the MIDDLE of the deck (themeFor still owns the first/last bookends
 *  and the dark-safe gate underneath). An EMPTY `dark` is not the same
 *  thing as "the plan says nothing should be dark" — it just as often means
 *  the model offered no candidates, or validatePlan dropped every one it did
 *  offer as out-of-range — and forcing every middle slide to light in that
 *  case silently flattened the deck's own per-batch theme choices, which had
 *  nothing to do with the plan failing. */
function planTheme(plan, sourceN, fallbackTheme) {
  if (!plan || !plan.dark.length) return fallbackTheme;
  return plan.dark.includes(sourceN) ? "dark" : "light";
}

/** The pace line a slide's plan entry adds to the choice/import prompt, or
 *  nothing when the plan has no opinion for this slide. */
function paceFor(plan, sourceN) {
  return plan?.pace?.[String(sourceN)];
}

/** Picks the best `role === "divider"` template for a section-break slide, by
 *  scoring the real library against a synthetic sparse signature built from
 *  the section title alone — a divider has no bullets, so `itemCount: 0` and
 *  `density: "sparse"` fall out of contentSignature() naturally. */
function pickDividerTemplate(sectionTitle, index, total) {
  const sig = contentSignature({ title: sectionTitle, bullets: [] }, { index, total });
  const list = shortlistFor(sig, { limit: 1, deckLength: total, templates: DIVIDER_TEMPLATES });
  return (list[0] && findTemplate(list[0].name)) || DIVIDER_TEMPLATES[0];
}

/**
 * A divider's content is the template's OWN example, with its title field(s)
 * replaced by the plan's section title — never invented prose. Every
 * registered divider's schema carries exactly one free-text field beyond
 * `meta`/`footer` (named `title` or `word` depending on the family) and
 * sometimes a `number` alongside it; `number` is left as the example's own,
 * since a plan gives a section NAME, never a section number.
 */
function dividerFields(template, sectionTitle) {
  const content = { ...(template.example || {}) };
  for (const [key, value] of Object.entries(content)) {
    if (key === "meta" || key === "footer" || key === "number") continue;
    if (typeof value === "string") content[key] = sectionTitle;
  }
  return content;
}

/** A slide's list of points for the outline. The drafted bullets are kept as
 *  a list on the mapping; joining them into one body string first made a
 *  five-point slide read as one point, and the layout was chosen for one. */
export function bulletsOf(slide) {
  if (Array.isArray(slide?.bullets) && slide.bullets.length) return slide.bullets;
  const body = slide?.content?.body;
  return Array.isArray(body) ? body : body ? [body] : [];
}

/** A divider whose title repeats the slide beside it reads as a glitch: the
 *  same heading appears twice in a row, one of them on a chapter break. This
 *  happened in a live deck ("Three ways forward" on a divider and then on the
 *  options slide). The divider is dropped and the drop is reported. */
export function keepDistinctDividers(dividers, mapping, { note }) {
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return dividers.filter((d) => {
    const title = norm(d.title);
    // A divider inserted at `after` sits between source slides `after` and `after + 1`.
    const before = norm(mapping[d.after - 1]?.title);
    const after = norm(mapping[d.after]?.title);
    if (title && (title === before || title === after)) {
      note(`Deck plan: the divider "${d.title}" repeats the slide beside it, so it was dropped.`);
      return false;
    }
    return true;
  });
}

/** Builds one inserted divider slide, chrome and theme included — the same
 *  builder both compose paths use, so a chapter break looks identical
 *  whichever path produced the deck around it. */
function buildDividerSlide({ sectionTitle, index, total, title }) {
  const template = pickDividerTemplate(sectionTitle, index, total);
  const chrome = deckChrome(index, { title });
  const content = dividerFields(template, sectionTitle);
  for (const key of ["meta", "footer"]) {
    if (key in (template.schema || {})) content[key] = chrome[key];
  }
  return {
    order: index,
    templateReference: { templateName: template.name, templateVersion: 1, templatePackId: "main-template" },
    themeOverride: themeFor(index, total, { templateName: template.name }),
    content,
  };
}

/**
 * Splices divider slides into a finished slide array at the positions the
 * plan named, offsetting each subsequent insertion by however many already
 * landed before it. `positions` is `{insertAt, title}[]` — a 0-based index
 * INTO THE ARRAY AS IT STOOD BEFORE ANY INSERTIONS, already resolved by the
 * caller (the two compose paths differ in how a plan's 1-based "after this
 * SOURCE slide" maps to an array position, because only import can split one
 * source into several output rows).
 */
function insertDividers(slides, positions, title) {
  if (!positions.length) return slides;
  const sorted = [...positions].sort((a, b) => a.insertAt - b.insertAt);
  const finalTotal = slides.length + positions.length;
  const out = [...slides];
  let offset = 0;
  for (const { insertAt, title: sectionTitle } of sorted) {
    const at = insertAt + offset;
    out.splice(at, 0, buildDividerSlide({ sectionTitle, index: at, total: finalTotal, title }));
    offset += 1;
  }
  return out;
}

/**
 * Final pass over a finished slide array: recomputes `order`, chrome's
 * `meta.page` and (where present) a fallback slide's `caption` "N / M" for
 * the positions slides actually ended up at. Divider insertion shifts every
 * slide after it, so a chrome/caption computed before insertion is stale —
 * this is the reindex the import path already needed for splits/drops
 * (rebaseFallback) and the prompt path now needs too, now that either path
 * can grow slides after the fact.
 */
function reindexSlides(slides) {
  let section = 0;
  return slides.map((s, i) => {
    if (!s?.content) return { ...s, order: i };
    const content = { ...s.content };
    if (content.meta) content.meta = { ...content.meta, page: String(i + 1) };
    /* The caption is the PageHeader's eyebrow — context for the title (an area,
     * a theme), or nothing. It used to be overwritten here with "N / M" on
     * every slide that had one, which both put a page counter where the brand
     * never has one and erased whatever real caption the model had written.
     * The page number already lives in the top bar. */
    if (typeof content.caption === "string") content.caption = stripCounter(content.caption);
    /* Chapter numbers count chapters. Every divider used to keep its template
     * example's "01", so a deck with three chapters said 01, 01, 01. */
    if (typeof content.number === "string" && SECTION_NUMBERED.has(s.templateReference?.templateName)) {
      section += 1;
      content.number = String(section).padStart(2, "0");
    }
    return { ...s, order: i, content };
  });
}

/** Templates whose `number` is a chapter number, counted through the deck. */
const SECTION_NUMBERED = new Set(liveTemplates
  .filter((t) => t.role !== "toc" && typeof t.schema?.number === "string" && /\b(section|chapter|e\.g\. 0\d|two digits)/i.test(t.schema.number))
  .map((t) => t.name));

/** A caption that is only a slide counter ("3 / 12", "Slide 3 of 12") says nothing. */
const COUNTER = /^\s*(?:slide\s+)?\d+\s*(?:\/|of)\s*\d+\s*$/i;
export function stripCounter(caption) {
  return COUNTER.test(caption) ? "" : caption;
}

/**
 * Lays an outline out across the real template library, via the provider, and
 * keeps only what actually renders.
 *
 * Every slide is proved by running the chosen template's own render() over the
 * drafted content (prepareContentUpdate). Anything the model got wrong — a
 * template that doesn't exist, content in the wrong shape, a field it left
 * empty — falls back to that slide's plain mapping rather than reaching the
 * deck broken. So the worst case is the old behaviour, never a blank slide.
 *
 * Returns slides in presentation shape, ready for createPresentation.
 */
export async function composeSlides(provider, proposedMapping, { title, subtitle, warnings, origin, imageSource, onProgress, analysis, onAnalysis, deadline, stats, exactCount = false, prompt = "", brief = null, references = [], authorImages = [] } = {}) {
  /* `stats` is an optional out-param: `stats.fallback` lists the slide numbers
   * that kept the plain default layout, so the caller can say so per slide. */
  /* `warnings` is an optional sink the caller passes in to learn what degraded.
   * Composition failing is not an error — the deck still ships on the plain
   * mapping — but it IS the difference between "the engine chose these layouts"
   * and "the engine never ran", and until now that difference reached only the
   * server log. A user looking at a flat deck had no way to tell which. */
  const note = (message) => { if (Array.isArray(warnings)) warnings.push(message); };
  const mapping = proposedMapping || [];
  const fallback = buildSlidesFromMapping(mapping, { title });
  const sink = progressSink(onProgress, mapping);
  if (!mapping.length) {
    // Nothing to build, but every other exit still emits one frame — so does
    // this one, kept consistent rather than a silent special case.
    sink.emit({ stage: "assembling" });
    return fallback;
  }

  const analysisByN = await analyzeOutlineForCompose(provider, mapping, { title, analysis, onAnalysis, note, sink });
  const plan = await planDeckForCompose(provider, mapping, { title, analysisByN, note, sink, deadline });

  if (origin === "import") {
    if (typeof provider?.composeImportDeck === "function") {
      const result = await composeImportedSlides(provider, mapping, { title, note, fallback, imageSource, sink, analysisByN, plan, deadline });
      sink.emit({ stage: "assembling" });
      return result;
    }
    // Falling through to the prompt path below would hand an imported
    // deck's transplanted content to composeDeck, which REWRITES it as fresh
    // copy — an import must never generate new wording for the user's own
    // slides. A provider without composeImportDeck (e.g. an older mock, or
    // one built only for the prompt path) means import-mode composition is
    // simply unavailable here, same posture as composeDeck missing below.
    note("Import layouts are unavailable on this machine — the deck uses default layouts.");
    sink.setStates(mapping.map((s) => s.slideNumber), "fallback");
    sink.emit({ stage: "assembling" });
    return fallback;
  }
  if (typeof provider?.composeDeck !== "function") {
    sink.setStates(mapping.map((s) => s.slideNumber), "fallback");
    sink.emit({ stage: "assembling" });
    return fallback;
  }

  // Until a slide is proven to have a chosen layout, it counts as fallback.
  // Import composition reports through its own sink states, so it is left alone.
  if (stats) stats.fallback = mapping.map((s) => s.slideNumber);

  /* The only figures this deck may show: those in the prompt (coach answers
   * included), the references and the brief's proof. A scene may be
   * illustrative; a number never is. */
  /* Only a reference's TEXT is material. Its id (a UUID) and its name are
   * labels: flattening the whole object let "41" from "…-41d4-…" pass as a
   * figure the material gave. */
  const referenceText = (Array.isArray(references) ? references : [])
    .map((r) => (typeof r === "string" ? r : String(r?.text ?? "")));
  const allowed = allowedNumbers({ prompt, references: referenceText, brief });
  /* A slide on the plain mapping is the outline's own words, held to the same
   * rule as a composed one — a deck that degraded (composition failed, or a
   * slide got no layout) must not ship the figures composition would have
   * taken out. Mutated in place: identity with `fallback[i]` marks a fallback. */
  const stripPlain = (plain, index) => {
    const p = stripFigures(findTemplate(plain.templateReference?.templateName), plain.content, allowed);
    if (!p.invented.length) return plain;
    plain.content = p.content;
    note(figuresNote(index + 1, p, " — the slide kept the default layout"));
    return plain;
  };
  // Never the cover or the closing: those bookends keep their own layouts.
  const isHook = (i) => i > 0 && i < mapping.length - 1 && mapping[i]?.role === "hook";
  const hookIndexes = new Set(mapping.map((_, i) => i).filter(isHook));
  const hookTemplates = HOOK_TEMPLATES.map((n) => liveTemplates.find((t) => t.name === n)).filter(Boolean);
  const textOfSlide = (s) => [s?.title, ...(Array.isArray(s?.content?.body) ? s.content.body : [s?.content?.body])]
    .filter(Boolean).join(" ");

  const outline = mapping.map((s, i) => ({
    title: s.title,
    bullets: bulletsOf(s),
    // Rides into the choice prompt only when the plan has an opinion for this
    // slide — an absent field is a no-op, same posture as every other
    // optional plan input here.
    ...(paceFor(plan, i + 1) ? { pace: paceFor(plan, i + 1) } : {}),
  }));

  /* Declared OUT here, not inside the try below, because the slide-building
   * pass further down reads it too. It was scoped to the try, so every slide
   * threw ReferenceError — and the per-slide catch was silent, so the whole
   * deck fell back to one repeated template with nothing logged anywhere. */
  const signatures = applyEmphasis(
    outlineSignatures(outline).map((sig, i) => (analysisByN.has(i + 1) ? applyAnalysis(sig, analysisByN.get(i + 1)) : sig)),
    plan
  );
  /* Hoisted for the same reason as `signatures` above: the slide-building pass
   * needs it too, to find a replacement when the model's pick would throw the
   * slide's content away. */
  let shortlists = [];

  let composed;
  try {
    /* Score the WHOLE library against each slide, then send the model the best
     * dozen per slide instead of all 229 as prose. That is what stops the
     * engine reaching for the same handful of layouts, and it is what lets the
     * library grow — the prompt now scales with the DECK, not the catalog. */
    /* Fewer candidates on a long deck. Twelve each is right for a deck someone
     * will actually read; for a 120-slide import it is 120 lists the choice
     * pass then has to be split across many requests, and the marginal
     * candidate is not what decides those. */
    /* NPS_SHORTLIST overrides the default, so how many candidates the model
     * sees can be measured rather than argued about. Twelve reaches 160 of the
     * 229 templates across every stored slide; twenty reaches 180 and still
     * fits one request (20k of the 30k pass-1 budget for a twelve-slide deck).
     * Whether more choice makes better decks is the open question. */
    const base = Number(process.env.NPS_SHORTLIST) || 12;
    const perSlide = outline.length > 30 ? Math.min(6, base) : outline.length > 18 ? Math.min(8, base) : base;
    /* Built in order, each list aware of what the earlier ones led with. Slides
     * whose content reads alike would otherwise get identical shortlists, and
     * the same layout would top every one — a uniform deck arriving by a
     * different route than the one already fixed. */
    const leading = new Set();
    shortlists = signatures.map((sig, i) => {
      /* The hook only ever sits on a hook layout, and always light. */
      if (isHook(i) && hookTemplates.length) {
        const list = shortlistFor(sig, { limit: perSlide, deckLength: outline.length, templates: hookTemplates });
        return list.map((c) => ({ ...c, darkSafe: false }));
      }
      // A slide whose figures are not in the material is not offered charts.
      const figuresAvailable = numbersIn(textOfSlide(mapping[i])).some((n) => allowed.has(n));
      const list = shortlistFor(sig, { limit: perSlide, deckLength: outline.length, avoid: leading, figuresAvailable, ...emphasisBoost(plan, i + 1) });
      if (list[0]) leading.add(list[0].name);
      return list.map((c) => ({ ...c, darkSafe: DARK_SAFE.has(c.name) }));
    });

    const result = await provider.composeDeck({
      title,
      subtitle,
      outline,
      shortlists,
      // The list the model reads is capped (a long reference holds thousands
      // of numbers); the check after composition uses the whole set.
      allowedNumbers: promptFigures({ prompt, references: referenceText, brief }),
      // The whole library — choosing well is the entire point, so nothing is
      // filtered out ahead of the model.
      templates: liveTemplates.map((t) => ({
        name: t.name, role: t.role, use: t.use, description: t.description,
        // The example travels too: showing the exact JSON shape is what keeps
        // structured fields from coming back flattened into a string. So does
        // `capacity` — every template declares how many items its layout
        // actually holds, and without it a six-point slide gets written into a
        // three-slot layout and silently overflows.
        schema: t.schema || {}, example: t.example || {}, capacity: t.capacity || null,
      })),
      // Pass 1 picks layouts, pass 2 writes the content the layouts chosen
      // hold — mapped straight onto the sink's own choosing/writing stages
      // rather than a third vocabulary the UI would need to know about.
      // Deck-level rules the model is only asked to follow (see variety.js).
      repairPicks: (picks, lists) => {
        // The hook is exempt: its neighbours move, it does not.
        const { picks: fixed, changes, unresolved } = enforceVariety(picks, lists, { deckLength: outline.length, fixed: hookIndexes });
        if (changes.length) {
          console.warn(`[compose] variety: ${changes.map((c) => `slide ${c.index + 1} ${c.from} → ${c.to}`).join("; ")}`);
        }
        if (unresolved.length) {
          console.warn(`[compose] variety: no alternative for slide(s) ${unresolved.map((i) => i + 1).join(", ")}`);
        }
        // A swapped layout must still be able to render dark.
        return fixed.map((p) => ({
          ...p,
          theme: p.theme === "dark" && DARK_SAFE.has(p.templateName) && !hookIndexes.has(p.index) ? "dark" : "light",
        }));
      },
      onBatch: (b) => {
        // b.slideNumbers is 1-based positions in `outline` (== `mapping`,
        // built 1:1 from it above), not the mapping's own slideNumber field.
        const numbers = (b.slideNumbers || []).map((i) => mapping[i - 1]?.slideNumber).filter(Boolean);
        const stage = b.pass === "fill" ? "writing" : "choosing";
        sink.setStates(numbers, stage);
        sink.emit({
          stage,
          detail: `${stage === "writing" ? "Writing content for" : "Choosing layouts for"} slide${numbers.length > 1 ? "s" : ""} ${numbers.join(", ")}`,
          done: b.index,
          total: b.total,
        });
      },
    });
    composed = Array.isArray(result?.slides) ? result.slides : [];
  } catch (err) {
    // Composition is an enhancement — never fail the whole deck on it. But it
    // must never fail QUIETLY either: a swallowed error here is invisible, and
    // its only symptom is a deck where every slide is the same content
    // template. That looked like "the AI isn't creative" for a long time when
    // it was really the composition prompt being rejected as too long.
    console.warn(`[generation] deck composition failed, using the plain mapping: ${err.message}`);
    note(`Layouts were not chosen for this deck: ${err.message}`);
    fallback.forEach(stripPlain);
    sink.setStates(mapping.map((s) => s.slideNumber), "fallback");
    sink.emit({ stage: "assembling" });
    return fallback;
  }
  if (!composed.some(Boolean)) {
    console.warn("[generation] deck composition returned no usable slides, using the plain mapping.");
    note("Layouts were not chosen for this deck — every slide uses the default.");
  }

  const usedPhotos = new Set();
  /* References marked "use on slides" fill photo slots before the library,
   * in order, once each across the deck — the same precedence an import
   * gives the author's own images. The brand choice turns them off. */
  const ownImages = imageSource === "brand" ? [] : [...(authorImages || [])];
  const built = fallback.map((plain, index) => {
    let pick = composed[index];
    if (!pick) return stripPlain(plain, index);
    // A hook pick from outside the hook layouts takes the best of them instead.
    if (hookIndexes.has(index) && !HOOK_TEMPLATES.includes(pick.templateName) && shortlists[index]?.[0]) {
      console.warn(`[compose] slide ${index + 1}: hook on ${pick.templateName} — using ${shortlists[index][0].name}.`);
      pick = { ...pick, templateName: shortlists[index][0].name };
    }
    const template = findTemplate(pick.templateName);
    if (!template) return stripPlain(plain, index);
    try {
      // Chrome is overwritten, not merged: the model is told to leave it alone
      // but reliably copies the example's placeholder name and page number, and
      // these are values the system knows for certain. Applied BEFORE
      // prepareContentUpdate so it is validated like everything else. Only the
      // chrome fields the template actually declares are set.
      /* Photography chosen for THIS slide, from the 208-image manifest, rather
       * than inherited from whatever the template's example happened to show.
       * `usedPhotos` runs across the whole deck so the same face does not
       * appear on three slides. */
      const sig = signatures[index];
      const slideText = [mapping[index]?.title, ...(Array.isArray(mapping[index]?.content?.body)
        ? mapping[index].content.body : [mapping[index]?.content?.body])].filter(Boolean).join(" ");
      const picks = choosePhotos({
        template,
        signature: sig,
        text: slideText,
        used: usedPhotos,
        // Covers and full-bleed layouts lay type over the image.
        textSafe: template.shape === "fullbleed" || template.role === "cover",
      });
      const chrome = deckChrome(index, { title });

      /** Fills one candidate template with this slide's content. */
      const build = (name) => {
        const t = findTemplate(name);
        if (!t) return null;
        const proposed = { ...(pick.content || {}) };
        for (const key of ["meta", "footer"]) {
          if (key in (t.schema || {})) proposed[key] = chrome[key];
          else delete proposed[key];
        }
        // Proves it renders. Merged over the template's own example so a field
        // the model omitted keeps a sane default instead of rendering empty.
        // Each candidate draws from a copy of the author's images: only the
        // layout finally kept takes them off the deck's queue (below).
        const takePhoto = photoQueue({ own: [...ownImages], picks, used: usedPhotos });
        const { content } = prepareContentUpdate(
          name,
          t.example || {},
          clampToCapacity(t, coerceToExample(t.example || {}, blankPersonPhotos(t, keepAssetPaths(t.example || {}, proposed, takePhoto.available() ? takePhoto : null))))
        );
        return { template: t, content };
      };

      let built = build(pick.templateName);
      let chosenName = pick.templateName;

      /* Does the finished slide still say what the slide was about?
       *
       * A closing slide carrying five board decisions — approve the model,
       * release the funding, authorise recruitment, the dashboard, the next
       * checkpoint — was laid out on portfolio/text-16, whose entire schema is
       * one word. It rendered as "Approve Model B" and the other four decisions
       * were gone. Nothing threw: the template simply has nowhere to put them,
       * so prepareContentUpdate dropped them, and the deck looked finished.
       *
       * Scoring already ranked that template 19 against the leader's 90 — it
       * was the model overriding a correct shortlist. So the guard belongs
       * here, at the outcome, not in the ranking: measure what survived, and if
       * most of the slide did not, use the best-scoring layout that keeps it. */
      if (built && retentionOf(slideText, built.content) < MIN_RETENTION) {
        const alternatives = (shortlists[index] || []).map((c) => c.name).filter((n) => n !== pick.templateName);
        for (const name of alternatives) {
          const candidate = build(name);
          if (candidate && retentionOf(slideText, candidate.content) >= MIN_RETENTION) {
            note(`Slide ${index + 1}: ${pick.templateName} could not hold the content, so ${name} was used instead.`);
            console.warn(`[compose] slide ${index + 1}: ${pick.templateName} dropped most of the content — using ${name}.`);
            built = candidate;
            chosenName = name;
            break;
          }
        }
      }
      /* Is any of the slide still the template's own sample? A field the model
       * left out is filled from the example on merge, so a chart chosen for a
       * slide with no figures shipped the sample chart — "$120M", "Q1 24",
       * "Segment 1" — on a € decision deck. A layout whose data the slide cannot
       * supply is the wrong layout: take the next one that is fully written,
       * and if none is, blank the sample rather than present it as fact. */
      if (built && exampleEcho(built.template, built.content).length) {
        const alternatives = (shortlists[index] || []).map((c) => c.name).filter((n) => n !== chosenName);
        let rescued = false;
        for (const name of alternatives) {
          const candidate = build(name);
          if (candidate && !exampleEcho(candidate.template, candidate.content).length
              && retentionOf(slideText, candidate.content) >= MIN_RETENTION) {
            note(`Slide ${index + 1}: ${chosenName} still showed its sample data, so ${name} was used instead.`);
            built = candidate;
            chosenName = name;
            rescued = true;
            break;
          }
        }
        if (!rescued) {
          const echoed = exampleEcho(built.template, built.content);
          note(`Slide ${index + 1}: removed sample data the layout came with (${echoed.join(", ")}).`);
          built = { ...built, content: blankFields(built.content, echoed) };
        }
      }
      /* Does the slide show a figure the material never gave? Take the next
       * non-data layout that holds the slide without one; failing that, take
       * the figures out. If that leaves a data layout without data, or loses
       * most of the slide, rebuild it on the best non-data layout (the
       * figures stripped there too); a data slide with nothing to show and no
       * such layout falls back to the plain mapping. Every step is a note. */
      const invented = built ? untraceable(built.content, allowed) : [];
      if (invented.length) {
        const nonData = (shortlists[index] || []).filter((c) => !isDataLayout(c) && c.name !== chosenName).map((c) => c.name);
        let rescued = false;
        for (const name of nonData) {
          const candidate = build(name);
          if (candidate && !untraceable(candidate.content, allowed).length
              && !exampleEcho(candidate.template, candidate.content).length
              && retentionOf(slideText, candidate.content) >= MIN_RETENTION) {
            note(`Slide ${index + 1}: removed figures not in the material (${invented.join(", ")}) — ${name} was used instead of ${chosenName}.`);
            built = candidate;
            chosenName = name;
            rescued = true;
            break;
          }
        }
        if (!rescued) {
          const result = stripFigures(built.template, built.content, allowed);
          const kept = retentionOf(slideText, result.content);
          if (result.broken || kept < MIN_RETENTION) {
            let rebuilt = null;
            for (const name of nonData) {
              const candidate = build(name);
              if (!candidate || exampleEcho(candidate.template, candidate.content).length) continue;
              const r = stripFigures(candidate.template, candidate.content, allowed);
              if (r.broken) continue;
              // A data layout with nothing left takes any non-data layout;
              // one that merely lost words takes one only if it keeps more.
              if (!result.broken && retentionOf(slideText, r.content) <= kept) continue;
              rebuilt = { name, candidate: { ...candidate, content: r.content }, r };
              break;
            }
            if (rebuilt) {
              note(figuresNote(index + 1, { invented, emptied: rebuilt.r.emptied },
                ` — rebuilt on ${rebuilt.name}, as ${chosenName} had ${result.broken ? "no data left to show" : "lost most of the slide"}`));
              built = rebuilt.candidate;
              chosenName = rebuilt.name;
            } else if (result.broken) {
              // The plain slide is the outline's own words; they are held to
              // the same rule. Mutated in place: `plain` is this slide's own
              // fallback object, and identity with it is what marks a fallback.
              const p = stripFigures(findTemplate(CONTENT_TEMPLATE), plain.content, allowed);
              plain.content = p.content;
              note(figuresNote(index + 1, { invented: [...new Set([...invented, ...p.invented])], emptied: p.emptied },
                ` — ${chosenName} had no data left to show and no other layout fits, so the slide kept the default layout`));
              return plain;
            } else {
              note(figuresNote(index + 1, result));
              built = { ...built, content: result.content };
            }
          } else {
            note(figuresNote(index + 1, result));
            built = { ...built, content: result.content };
          }
        }
      }
      if (!built) return stripPlain(plain, index);
      // The author's images this slide shows are spent; one a layout blanked
      // (a non-team portrait slot) stays queued for a later slide.
      if (ownImages.length) {
        const shown = JSON.stringify(built.content);
        for (let k = ownImages.length - 1; k >= 0; k--) if (shown.includes(ownImages[k])) ownImages.splice(k, 1);
      }

      return {
        order: index,
        templateReference: { templateName: chosenName, templateVersion: 1, templatePackId: "main-template" },
        themeOverride: themeFor(index, mapping.length, {
          templateName: chosenName,
          theme: hookIndexes.has(index) ? "light" : planTheme(plan, index + 1, pick.theme),
        }),
        // Persisted on the slide: later passes (the audit) find the hook by it.
        ...(hookIndexes.has(index) ? { role: "hook" } : {}),
        content: withSpeakerNotes(
          stripExampleLeftovers(stripLorem(built.content), built.template.example || {}),
          built.template, mapping[index]?.content?.notes),
        // Candidate names only — read by the visual review pass to find an
        // alternate layout for a slide that overflows its own. Never
        // persisted: stripShortlists() removes this below, unconditionally,
        // whether or not review actually runs.
        __shortlist: (shortlists[index] || []).map((c) => c.name),
      };
    } catch (err) {
      /* Never silent. A slide quietly reverting to the plain mapping looks
       * exactly like "the engine chose badly", and three separate bugs have now
       * hidden behind this catch — a ReferenceError, a schema mismatch and a
       * render failure — each costing hours to find because nothing said a
       * word. The deck still degrades gracefully; it just says so. */
      console.warn(`[compose] slide ${index + 1} fell back to the plain mapping: ${err.message}`);
      note(`Slide ${index + 1} kept the default layout: ${err.message}`);
      return stripPlain(plain, index);
    }
  });

  // A slot that stayed identical to its plain fallback never got a chosen
  // layout — everything else did, whatever happened along the way (a
  // retention rescue, a repaired field). Reference equality against the
  // exact fallback element is what tells the two apart here.
  mapping.forEach((s, index) => {
    sink.setStates([s.slideNumber], built[index] === fallback[index] ? "fallback" : "done");
  });
  if (stats) stats.fallback = mapping.filter((_, i) => built[i] === fallback[i]).map((s) => s.slideNumber);

  // The prompt path is 1:1 with `mapping` (no splitting), so a divider's
  // `after` (1-based source slide) is already the 0-based array position to
  // insert at. `insertDividers` is a no-op when the plan carries none;
  // `reindexSlides` always runs so `order`/chrome stay correct whether or not
  // anything was inserted.
  // A stated slide count is exact, and a divider would be an extra slide on
  // top of it, so none are added when the count is fixed.
  let positions = [];
  if (exactCount && (plan?.dividers || []).length) {
    note("Section dividers were left out so the deck has exactly the number of slides asked for.");
  } else {
    positions = keepDistinctDividers(plan?.dividers || [], mapping, { note }).map((d) => ({ insertAt: d.after, title: d.title }));
  }
  // Page numbers on contents slides are set here, from the final order, after
  // dividers have landed; a drafted number is never trusted.
  const pageKeyFor = contentsPageKey;
  const isClosing = (name) => findTemplate(name)?.role === "closing";
  const drafted = resolvePageIndexes(reindexSlides(insertDividers(built, positions, title)), { pageKeyFor, isClosing });
  // Wording to the Nagarro voice, before review so review sees the final words.
  const ordered = await runVoicePass(provider, drafted, { register: brief?.register || "thought", allowed, note, sink, deadline });
  const reviewed = await runVisualReview(ordered, { title, note, sink, deadline });
  // Review may rebuild a slide over an alternate's example: check again.
  const result = recheckFiguresAfterReview(ordered, reviewed, { allowed, note }).map((s) => {
    if (s && "__shortlist" in s) { const { __shortlist, ...rest } = s; return rest; }
    return s;
  });
  // Emitted AFTER review, not before: review's own "reviewing" frames must
  // land between the last "writing"/"choosing" frame and "assembling" — the
  // import path already gets this right (composeImportedSlides returns
  // straight from runVisualReview and composeSlides emits "assembling" only
  // once that's back), this was the prompt path's own frame emitted too
  // early, backwards from what the UI expects.
  sink.emit({ stage: "assembling" });
  return result;
}

/**
 * Fields of `content` that are still exactly the template's example data:
 * structured values (chart bars, legends, rows) and prose of 12+ characters.
 * Chrome, notes and image/logo slots are the system's own and never count;
 * short labels ("Q1", "%") can be a real answer that happens to match.
 *
 * @returns {string[]} field names
 */
export function exampleEcho(template, content = {}) {
  const example = template?.example || {};
  return Object.keys(template?.schema || {}).filter((k) => {
    if (k === "meta" || k === "footer" || k === "notes" || k === "caption") return false;
    const want = example[k], got = content[k];
    if (want == null || got == null) return false;
    if (typeof want === "string") return want.length >= 12 && !ASSET_PATH.test(want) && got === want;
    if (typeof want !== "object") return false;
    if (Array.isArray(want) && want.every((v) => typeof v === "string" && v.length <= 6)) return false;
    if (JSON.stringify(want).includes('"assets/')) return false;
    return JSON.stringify(want) === JSON.stringify(got);
  });
}

/** Empties the named fields, keeping each one's type so the layout still renders. */
function blankFields(content, fields) {
  const out = { ...content };
  for (const k of fields) out[k] = Array.isArray(out[k]) ? [] : typeof out[k] === "string" ? "" : out[k] && typeof out[k] === "object" ? {} : out[k];
  return out;
}

// retentionOf / MIN_RETENTION live in ./content-retention.js — imported above,
// re-exported here so existing callers (tests, this module's own use below)
// keep importing them from generation-service.js unchanged. See that module's
// header for why this measurement was pulled out rather than left local.
export { retentionOf, MIN_RETENTION };

/**
 * Reshapes model content to the shape the template renders.
 *
 * Eighteen templates render `body` with .map(); the model returns it as a
 * paragraph often enough that two of ten generated decks hit it. The render
 * check caught the TypeError and did the safe thing — kept the slide on the
 * default layout — so nothing broke, and the deck quietly lost both the layout
 * that was chosen for it and the words written for that layout. It showed up
 * only as a duplicate template in the variety count.
 *
 * A string where a list belongs is not a failure, it is a formatting
 * difference, and the template's own example says which is wanted. Only that
 * mismatch is touched: an unknown key, or a value already the right shape,
 * passes through untouched.
 *
 * @param {object} example  the template's example, used as the shape reference
 * @param {object} content  what the model produced
 */
export function coerceToExample(example, content) {
  if (!example || !content || typeof content !== "object") return content;

  const shape = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
  const out = Array.isArray(content) ? [...content] : { ...content };

  for (const [key, want] of Object.entries(example)) {
    if (!(key in out)) continue;
    const got = out[key];
    if (shape(want) === shape(got)) {
      // Same shape: recurse, so a nested { title, items } is reshaped too.
      if (shape(want) === "object") out[key] = coerceToExample(want, got);
      else if (shape(want) === "array" && Array.isArray(want[0])) {
        /* A grid: rows of CELLS, each cell a list of its own. The model
         * returns `cells: ["a", "b"]` where the layout renders
         * `cells: [["a"], ["b"]]`, and both are arrays — so the shapes match
         * at this level and the mismatch one level down went unseen. It cost
         * two slides their chosen layout across twenty generated decks. */
        out[key] = got.map((cell) => (Array.isArray(cell) ? cell : [String(cell)]));
      } else if (shape(want) === "array" && want[0] && typeof want[0] === "object") {
        out[key] = got.map((row) => coerceToExample(want[0], row));
      } else if (shape(want) === "array" && typeof want[0] === "string") {
        // A list of words answered with rows: keep each row's words.
        out[key] = got.map(toText);
      }
      continue;
    }
    if (shape(want) === "array" && typeof got === "string") {
      out[key] = splitIntoItems(got);
    } else if (shape(want) === "string" && Array.isArray(got)) {
      out[key] = got.filter((v) => typeof v === "string").join(" ");
    } else if (shape(want) === "string" && got && typeof got === "object") {
      out[key] = toText(got);
    }
  }
  return out;
}

/** A paragraph as list items: its sentences when there are several, else itself. */
function splitIntoItems(text) {
  const parts = String(text)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts : [String(text).trim()];
}

/**
 * Last-resort net: lorem ipsum must never reach a finished slide.
 *
 * Content is merged over the template's example so a field nobody wrote still
 * renders — but most examples are filled with lorem ipsum, so that safety net
 * is also how filler text ships. The composition's repair pass asks again for
 * any missing field; this catches the case where even that came back short.
 *
 * Deliberately narrow — it matches lorem ipsum and nothing else. Blanking a
 * field is a visibly unfinished slide; blanking real copy because it tripped a
 * loose heuristic would be worse, and silent.
 */
export function stripLorem(value) {
  if (typeof value === "string") return /lorem ipsum/i.test(value) ? "" : value;
  if (Array.isArray(value)) return value.map(stripLorem);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripLorem(v)]));
  }
  return value;
}

/** A word that only ever names a field rather than saying anything. */
const BARE_PLACEHOLDER = /^(?:title|subtitle|caption|category|heading|description|text|label|name|word|date|project|company|client|author|source|role|month year|project \d+|year \d+|phase \d+|item \d+|20\d{2})$/i;

/**
 * Removes example values the model left behind.
 *
 * Content is merged over the template's example so a field the model omitted
 * keeps a sane default — which is right for chrome and for image paths, and
 * wrong for words. A generated cover shipped with `project: "Project"` printed
 * on it, and a portfolio slide with a meta value of "2025", because the model
 * filled the fields it cared about and left the rest as it found them.
 *
 * Only a value that is BOTH unchanged from the example AND a bare placeholder
 * word is blanked. A real slide can legitimately say "2025"; one that says it
 * because nobody wrote anything is the example showing through. Images and
 * chrome are untouched — keepAssetPaths and deckChrome own those deliberately.
 *
 * @param {object} content   what will be rendered
 * @param {object} example   the template's own example
 */
export function stripExampleLeftovers(content, example) {
  if (!content || typeof content !== "object" || !example) return content;
  const out = Array.isArray(content) ? [...content] : { ...content };
  for (const [key, value] of Object.entries(out)) {
    if (key === "meta" || key === "footer") continue;
    const shown = Array.isArray(example) ? example[0]?.[key] : example?.[key];
    if (typeof value === "string") {
      if (/^assets\//.test(value)) continue;                       // an image path
      if (value === shown && BARE_PLACEHOLDER.test(value.trim())) out[key] = "";
      // A caption nobody wrote is the example's eyebrow ("Typography", "Case
      // study") describing some other slide. Captions are optional: drop it.
      else if (key === "caption" && value === shown) out[key] = "";
    } else if (Array.isArray(value) && shown) {
      out[key] = value.map((row, i) =>
        row && typeof row === "object"
          ? stripExampleLeftovers(row, Array.isArray(shown) ? shown[i] ?? shown[0] : shown)
          : row);
    } else if (value && typeof value === "object" && shown) {
      out[key] = stripExampleLeftovers(value, shown);
    }
  }
  return out;
}

/**
 * Trims list fields to what the layout can actually show.
 *
 * These templates are a fixed 1920x1080 canvas with fixed-size slots; there is
 * no reflow. A list sized for three lines handed six runs off the slide, and
 * nothing downstream notices — `assertRenders` only proves the markup builds,
 * not that it fits. Every template declares `capacity` for exactly this, and
 * the engine simply was not reading it.
 *
 * The allowance is per FIELD, not the template's total: `capacity.max` counts
 * the layout's main repeatable slot, so a template whose example carries three
 * `meta_items` alongside a capacity of 2 must keep its three. Taking the larger
 * of the two can only ever remove genuine overflow.
 */
export function clampToCapacity(template, content) {
  const max = Number(template?.capacity?.max) || 0;
  const out = { ...content };

  for (const [field, value] of Object.entries(out)) {
    const example = template?.example?.[field];

    // Lists: bound the number of entries.
    if (Array.isArray(value)) {
      if (!max) continue;
      const allowed = Math.max(max, Array.isArray(example) ? example.length : 0);
      if (value.length > allowed) out[field] = value.slice(0, allowed);
      continue;
    }

    /* Prose: bound the LENGTH.
     *
     * This clamp used to skip anything that wasn't an array, so `capacity` only
     * ever constrained how many items a layout held, never how much text went
     * in one. A 780-character body on planning/grid-03 printed straight through
     * the card below it — and survived into the exported .pptx, where the two
     * shapes overlap by about an inch. The same slide at 225 characters is
     * clean, so length was the only variable.
     *
     * The template's own example is the budget: it was authored to fit. The
     * allowance adds real slack on top so ordinary variation is untouched and
     * only genuine overflow is cut. */
    /* Only body-length prose is clamped. A heading or subtitle whose template
     * example is short got a budget of about 1.4× that example, so a real
     * 70-character headline was cut to 40 with an ellipsis mid-phrase
     * ("progressive…", "with…") on several slides of a live deck. Overflow
     * is a layout risk for bodies; for a short field a truncated phrase is
     * the worse failure, so those are left as written. */
    if (typeof value === "string" && typeof example === "string" && example.length >= PROSE_CLAMP_MIN) {
      if (ASSET_PATH.test(example)) continue; // a path, not prose
      out[field] = clampText(value, textBudget(example.length));
    }
  }
  return out;
}

/** How long a piece of prose may be, given the length the template's own
 *  example uses. Generous — the point is to catch a body that is three times
 *  too long, not to police wording. The additive floor keeps short label
 *  fields ("Caption", "Approach") from being squeezed. */
/** Shortest template example whose prose field is clamped at all. Below it the
 *  field is a heading, subtitle or label, which is never cut. */
const PROSE_CLAMP_MIN = 120;

function textBudget(exampleLength) {
  return Math.max(Math.round(exampleLength * 1.4), exampleLength + 32);
}

/**
 * Shortens `text` to `budget` at a natural boundary.
 *
 * Prefers to end on a sentence, falls back to a word, and only adds an ellipsis
 * when it had to cut mid-thought. A slightly shortened sentence is a far better
 * outcome than text printed on top of another element, but cutting mid-word
 * looks like a bug, which is why this does not simply slice.
 */
export function clampText(text, budget) {
  if (typeof text !== "string" || text.length <= budget) return text;

  const head = text.slice(0, budget);

  // A sentence end late enough in the budget to still say something.
  const sentence = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  if (sentence >= budget * 0.6) return text.slice(0, sentence + 1);

  const word = head.lastIndexOf(" ");
  return `${(word >= budget * 0.5 ? head.slice(0, word) : head).trimEnd()}…`;
}

/**
 * Attaches the slide's speaker notes without trampling a template's own field.
 *
 * Speaker notes ride along on every slide as `content.notes`. That is fine for
 * 228 of the 229 templates — but planning/grid-15 declares its OWN `notes`
 * field, an array of three strings it renders on the slide. Writing the speaker
 * note string over it made the template's `notes.map(...)` throw, so the slide
 * failed to mount at all: blank in the editor, blank in the export. It was
 * invisible because the assignment happened AFTER prepareContentUpdate, so the
 * render check that exists precisely to catch this never saw it.
 *
 * Where the template claims the name, the template wins — its field is what the
 * audience sees, and a speaker note nothing currently reads is not worth a
 * broken slide.
 */
function withSpeakerNotes(content, template, notes) {
  if ("notes" in (template?.schema || {})) return content;
  return { ...content, notes: notes || "" };
}

export const ASSET_PATH = /^(assets\/|\/assets\/|https?:\/\/)|\.(jpe?g|png|svg|webp|gif)$/i;

/**
 * Restores every asset path from the template's own example, at the same
 * position in the structure.
 *
 * The model is told not to invent image paths, but it is being asked to write
 * a `people` array whose rows each carry an `image` — and a plausible-looking
 * `assets/photography/team-lead.jpg` that doesn't exist renders as a broken
 * image on a slide that otherwise looks finished. Which photos exist is
 * something the system knows and the model does not, so the model's value is
 * simply not used. Arrays cycle: three people over two example photos reuse
 * the first, which is always better than a 404.
 */
export function keepAssetPaths(example, proposed, pick = null) {
  if (typeof example === "string") {
    if (!ASSET_PATH.test(example)) return proposed;
    // A chosen photograph, when one was selected for this slide; otherwise the
    // template's own, which is always a real file.
    return isPhoto(example) && pick ? pick() : example;
  }
  if (Array.isArray(example)) {
    if (!Array.isArray(proposed) || !example.length) return proposed;
    return proposed.map((row, i) => keepAssetPaths(example[i % example.length], row, pick));
  }
  if (example && typeof example === "object") {
    if (!proposed || typeof proposed !== "object" || Array.isArray(proposed)) return proposed;
    const out = { ...proposed };
    for (const [key, value] of Object.entries(example)) {
      if (key in out) out[key] = keepAssetPaths(value, out[key], pick);
      else if (typeof value === "string" && ASSET_PATH.test(value)) {
        out[key] = isPhoto(value) && pick ? pick() : value;
      }
    }
    return out;
  }
  return proposed;
}

/**
 * Empties the portrait slots of people who are not the presenting team.
 *
 * The library's photographs are Nagarro people. On a team slide that is right;
 * beside a client's quote ("CIO, European insurer") or a research participant
 * it says this stranger is that person. Rows carrying a `name` on a layout that
 * is not a team or CV layout get no photograph — the avatar renders empty.
 */
const PEOPLE_ROLES = new Set(["team", "cv"]);
export function blankPersonPhotos(template, content) {
  if (!content || typeof content !== "object" || PEOPLE_ROLES.has(template?.role)) return content;
  const out = { ...content };
  for (const [key, rows] of Object.entries(out)) {
    if (!Array.isArray(rows)) continue;
    out[key] = rows.map((row) => {
      if (!row || typeof row !== "object" || typeof row.name !== "string") return row;
      const r = { ...row };
      for (const [k, v] of Object.entries(r)) if (typeof v === "string" && isPhoto(v)) r[k] = "";
      return r;
    });
  }
  return out;
}

/** A photograph — from the library OR extracted from an imported deck — as
 *  opposed to a logo, icon or scribble. Only photographs are chosen per
 *  slide; brand assets stay where they are. */
function isPhoto(value) {
  return /^assets\/(photography|uploads)\//i.test(String(value));
}

/* The page chrome every v2 template renders. It is derived, never authored:
 * the slide number and the deck's name are things the system knows exactly, so
 * asking a model for them can only introduce error. The composed path leans on
 * this for the same reason — left to itself the model copies the example's
 * "Presentation Name" and its page number onto every slide. */
export function deckChrome(index, { title, client } = {}) {
  const now = new Date();
  return {
    meta: { studio: "Product Studio", name: title || "Presentation", page: String(index + 1) },
    /* The Figma Footer: the presentation's name, who it was prepared for, and
     * the copyright at the right. "Prepared for" is left blank rather than
     * filled with a placeholder when the client is not known; the column's
     * hairline still draws, so the footer keeps its shape. */
    footer: {
      col1: title || "Presentation",
      col2: client ? `Prepared for ${client}` : "",
      col3: "",
      copyright: `© ${now.getFullYear()}`,
    },
  };
}

/**
 * Rebuilds a plain fallback slide's chrome for the position it actually ends
 * up at, after splits and drops have shifted everything downstream of it.
 *
 * The fallback array is built once, up front, against the ORIGINAL mapping —
 * one slide in, one slide out — so `fallback[i].content.meta.page` and
 * `.caption` ("N / M") say where source slide i would have landed in a deck
 * with no splits. Once a different source slide splits into two or three
 * rows, or drops out with a build failure, every fallback slide reused after
 * that point is at a different index and the deck is a different length —
 * so both the chrome page number AND the "N / M" caption must be
 * recomputed, or a degraded slide displays a stale position next to the
 * correctly-numbered slides around it.
 */
function rebaseFallback(plain, index, total, title) {
  const content = { ...plain.content, ...deckChrome(index, { title }) };
  return { ...plain, order: index, content };
}

/**
 * The import twin of the prompt path below: combined choose+fill rows from
 * the provider, splitting allowed, the author's images placed before any
 * brand photograph. A source slide with no usable rows keeps its plain
 * fallback slide — degradation is per-slide and always announced.
 */
export async function composeImportedSlides(provider, mapping, { title, note, fallback, imageSource, sink, analysisByN = new Map(), plan = null, deadline } = {}) {
  const outline = mapping.map((s, i) => ({
    title: s.title,
    bullets: bulletsOf(s),
    tables: s.content?.tables || [],
    notes: s.content?.notes || "",
    elements: s.elements || {},
    ...(paceFor(plan, i + 1) ? { pace: paceFor(plan, i + 1) } : {}),
  }));

  /* Signatures see the source's structure, not just its text: a slide that
   * carried an image wants a visual layout; one that carried a table wants a
   * comparison; a table's rows count as items for capacity fit. The LLM
   * analysis (if one ran) is folded in last, same as the prompt-generated
   * path — after every regex- and structure-derived signal is in place, so
   * it can only ADD to what's already known, never override it. */
  const signatures = applyEmphasis(outlineSignatures(outline).map((sig, i) => {
    const el = mapping[i]?.elements || {};
    const tableRows = (mapping[i]?.content?.tables || []).reduce((n, t) => Math.max(n, t.length), 0);
    const structural = {
      ...sig,
      wantsVisual: sig.wantsVisual || el.images > 0,
      isComparison: sig.isComparison || el.tables > 0,
      itemCount: Math.max(sig.itemCount, tableRows),
    };
    return analysisByN.has(i + 1) ? applyAnalysis(structural, analysisByN.get(i + 1)) : structural;
  }), plan);

  const leading = new Set();
  const shortlists = signatures.map((sig, i) => {
    /* Six candidates, not twelve: each import candidate travels WITH its
     * schema and example (the combined pass fills content too), so the same
     * budget holds fewer, richer entries. */
    const list = shortlistFor(sig, { limit: 6, deckLength: outline.length, avoid: leading, ...emphasisBoost(plan, i + 1) });
    if (list[0]) leading.add(list[0].name);
    return list.map((c) => {
      const t = findTemplate(c.name);
      return { ...c, darkSafe: DARK_SAFE.has(c.name), schema: t?.schema || {}, example: t?.example || {} };
    });
  });

  let result;
  try {
    result = await provider.composeImportDeck({
      title, outline, shortlists,
      // The import path chooses layout and writes content in ONE combined
      // request per batch, so there is no separate "writing" pass to report —
      // every batch lands as "choosing"; per-source state moves on to
      // "writing"/"done"/"fallback" below, once the rows are known.
      onBatch: (b) => {
        const numbers = (b.slideNumbers || []).map((i) => mapping[i - 1]?.slideNumber).filter(Boolean);
        sink?.setStates(numbers, "choosing");
        sink?.emit({
          stage: "choosing",
          detail: `Choosing layouts for slide${numbers.length > 1 ? "s" : ""} ${numbers.join(", ")}`,
          done: b.index,
          total: b.total,
        });
      },
    });
  } catch (err) {
    console.warn(`[generation] import composition failed, using the plain mapping: ${err.message}`);
    note(`Layouts were not chosen for this deck: ${err.message}`);
    sink?.setStates(mapping.map((s) => s.slideNumber), "fallback");
    return fallback;
  }
  for (const w of result?.warnings || []) note(w);

  /* Task 4's own provider already caps a source at 3 rows, so this only fires
   * for a misbehaving provider — but that is exactly when losing rows
   * silently would matter most, so it's still announced, once per source
   * rather than once per dropped row. */
  const droppedSources = new Set();
  const bySource = new Map();
  for (const row of result?.rows || []) {
    const list = bySource.get(row.source) || [];
    if (list.length < 3) list.push(row);
    else droppedSources.add(row.source);
    bySource.set(row.source, list);
  }
  for (const source of droppedSources) {
    note(`Slide ${source} was split into more parts than allowed — extra parts were dropped.`);
  }

  const total = mapping.reduce((n, s) => n + Math.max(1, (bySource.get(s.slideNumber) || []).length), 0);
  const usedPhotos = new Set();
  const slides = [];
  // Completed SOURCE slides (not output rows — a split source is still one
  // unit of work from the sink's point of view), so `done`/`total` here count
  // the same things the mapping-shaped `slides` array does.
  let completedSources = 0;
  // 1-based source slide number -> index into `slides` immediately after its
  // last output row. What a plan's divider "after: N" resolves against.
  const sourceEndIndex = new Map();

  mapping.forEach((src, i) => {
    const rows = bySource.get(src.slideNumber) || [];
    if (!rows.length) {
      sink?.setStates([src.slideNumber], "fallback");
      completedSources += 1;
      sink?.emit({
        stage: "writing",
        detail: `Slide ${src.slideNumber} kept its default layout`,
        done: completedSources, total: mapping.length,
      });
      slides.push(rebaseFallback(fallback[i], slides.length, total, title));
      // Same reasoning as the main sourceEndIndex.set() below: this source
      // still produced exactly one output row (its fallback), so a divider
      // planned "after" it must resolve past that row too. Without this, a
      // divider after a fallback source landed at the WRONG position
      // whenever an earlier source had split into more than one row — every
      // source before it walks `sourceEndIndex`, but this early `return`
      // skipped past the one line that records it.
      sourceEndIndex.set(src.slideNumber, slides.length);
      return;
    }
    sink?.setStates([src.slideNumber], "writing");
    sink?.emit({
      stage: "writing",
      detail: `Writing slide ${src.slideNumber} of ${mapping.length}`,
      done: completedSources, total: mapping.length,
    });

    /* The author's own images first; the brand library only fills slides that
     * had none (or when the user chose brand photography for the deck). This
     * queue is scoped to one SOURCE slide and drains across all of its split
     * rows, in row order — the first row(s) consume the source's own images,
     * and only once those run out do later rows fall back to brand
     * photography from `picks`. */
    const ownImages = imageSource === "brand" ? [] : [...(src.content?.images || [])];
    const slideText = [src.title, ...(Array.isArray(src.content?.body) ? src.content.body : [src.content?.body])]
      .filter(Boolean).join(" ");

    for (const row of rows) {
      const template = findTemplate(row.templateName);
      if (!template) {
        note(`Slide ${src.slideNumber} kept its default layout — "${row.templateName}" is not a registered template.`);
        slides.push(rebaseFallback(fallback[i], slides.length, total, title));
        continue;
      }
      const index = slides.length;
      const picks = choosePhotos({
        template, signature: signatures[i], text: slideText, used: usedPhotos,
        textSafe: template.shape === "fullbleed" || template.role === "cover",
      });
      let nextPhoto = 0;
      const takePhoto = () => {
        if (ownImages.length) return ownImages.shift();
        const chosen = picks[nextPhoto++] ?? picks[picks.length - 1] ?? null;
        if (chosen) usedPhotos.add(chosen);
        return chosen;
      };
      const chrome = deckChrome(index, { title });
      const proposed = { ...(row.content || {}) };
      for (const key of ["meta", "footer"]) {
        if (key in (template.schema || {})) proposed[key] = chrome[key];
        else delete proposed[key];
      }
      try {
        const coerced = coerceToExample(template.example || {},
          keepAssetPaths(template.example || {}, proposed, (ownImages.length || picks.length) ? takePhoto : null));
        const clamped = clampToCapacity(template, coerced);
        const trimmed = Object.keys(clamped).some((field) =>
          Array.isArray(clamped[field]) && Array.isArray(coerced[field]) &&
          clamped[field].length < coerced[field].length
        );
        if (trimmed) {
          note(`Slide ${src.slideNumber} holds more content than the "${template.name}" layout fits — some points were trimmed.`);
        }
        const { content } = prepareContentUpdate(
          template.name,
          template.example || {},
          clamped
        );
        // The same guard the prompt path runs. A layout with no slot for a
        // source slide's heading or body dropped them silently (a live import
        // lost its title and four points to an icon grid). Keep the text, on
        // the plain layout, and say so.
        if (retentionOf(slideText, content) < MIN_RETENTION) {
          note(`Slide ${src.slideNumber} kept its default layout — "${template.name}" has no room for its text.`);
          slides.push(rebaseFallback(fallback[i], index, total, title));
          continue;
        }
        slides.push({
          order: index,
          templateReference: { templateName: template.name, templateVersion: 1, templatePackId: "main-template" },
          themeOverride: themeFor(index, total, {
            templateName: template.name,
            theme: planTheme(plan, src.slideNumber, row.theme),
          }),
          content: withSpeakerNotes(content, template, src.content?.notes),
          // Same scratch field composeSlides threads through — see its own
          // comment. stripShortlists() removes it below, unconditionally.
          __shortlist: (shortlists[i] || []).map((c) => c.name),
        });
      } catch (err) {
        note(`Slide ${src.slideNumber} kept its default layout — its content did not fit "${template.name}".`);
        slides.push(rebaseFallback(fallback[i], index, total, title));
      }
    }

    // The user chose source images and some were never placed on any of this
    // source slide's rows — every row's own template ran out of image slots
    // (or had none) before ownImages drained. Announced once per source slide
    // rather than once per leftover image, same posture as the other
    // composeImportedSlides warnings.
    if (ownImages.length > 0) {
      note(`Slide ${src.slideNumber}'s images did not fit the chosen layout${rows.length > 1 ? "s" : ""} and were left out.`);
    }
    sink?.setStates([src.slideNumber], "done");
    completedSources += 1;
    sink?.emit({
      stage: "writing",
      detail: `Wrote slide ${src.slideNumber} of ${mapping.length}`,
      done: completedSources, total: mapping.length,
    });

    // Recorded AFTER every row this source produced (including a plain
    // fallback) has been pushed, so a divider planned for "after" this
    // source lands past every one of its rows — a split source is still one
    // chapter unit even though it became several output slides.
    sourceEndIndex.set(src.slideNumber, slides.length);
  });

  // A source with zero rows (kept its plain fallback, or was skipped
  // entirely for content reasons) never runs the loop body above; guard so a
  // divider planned "after" it still resolves to a real position instead of
  // `undefined` falling through to `insertDividers`' NaN handling.
  const positions = (plan?.dividers || []).map((d) => ({
    insertAt: sourceEndIndex.get(d.after) ?? d.after,
    title: d.title,
  }));
  return runVisualReview(reindexSlides(insertDividers(slides, positions, title)), { title, note, sink, deadline });
}

export function buildSlidesFromMapping(proposedMapping, { title } = {}) {
  const mapping = proposedMapping || [];
  const total = mapping.length;
  return mapping.map((slide, index) => {
    const rawBody = slide.content?.body;
    const bodyArray = Array.isArray(rawBody) ? rawBody.filter(Boolean) : rawBody ? [rawBody] : [];
    const notes = slide.content?.notes || "";
    // Every v2 template renders the same page chrome, and expects it as
    // content rather than deriving it — an absent `meta`/`footer` leaves the
    // top bar and footer blank on an otherwise finished slide.
    const chrome = deckChrome(index, { title });

    if (index === 0) {
      return {
        order: index,
        templateReference: { templateName: COVER_TEMPLATE, templateVersion: 1, templatePackId: "main-template" },
        /* Even a degraded deck opens on brand. Only the cover: the last slide
         * here is a plain content template rather than a closing, and a dark
         * content slab is not the other half of the sandwich. */
        themeOverride: themeFor(0, Math.max(total, 3), { templateName: COVER_TEMPLATE, theme: "dark" }),
        content: {
          title: slide.title || "",
          subtitle: bodyArray[0] || "",
          company: "Nagarro",
          date: "",
          project: "",
          notes,
          ...chrome,
        },
      };
    }
    return {
      order: index,
      templateReference: { templateName: CONTENT_TEMPLATE, templateVersion: 1, templatePackId: "main-template" },
      ...(slide.role === "hook" ? { role: "hook" } : {}),
      content: {
        caption: "",
        title: slide.title || "",
        subtitle: "",
        // The generator returns bullets; this template's body is one lead
        // paragraph, so they are joined rather than dropped. The user can
        // restructure any slide from the AI panel afterwards.
        // One paragraph per point, separated by a blank line: joined with a
        // space they read as one undifferentiated block.
        intro: bodyArray.join("\n\n"),
        notes,
        ...chrome,
      },
    };
  });
}
