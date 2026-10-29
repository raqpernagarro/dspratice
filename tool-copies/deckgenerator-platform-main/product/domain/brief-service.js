// =============================================================================
// Brief Service — the prompt coach (v2), Domain Layer.
//
// The coach opens at every prompt-path Generate as a question form. The set of
// questions is fixed by rules (js/brief-check.js coachQuestions): audience/goal
// and key points only when the checklist shows them missing, the reference
// question when nothing is attached, the hook and the length always. One
// short model call tailors the content questions' wording and options, and
// may add a figures question when the topic needs numbers. Anything that goes
// wrong — an error, the 30s budget, a usage limit, an answer in the wrong
// shape — returns the fixed set instead. The browser opens the form with that
// same fixed set at once and swaps in tailored options when this answers, so
// the person at the composer never waits for, or sees an error from, this.
//
// Takes its AIProvider by constructor, like GenerationService, so tests run
// it with a stub and the route chooses the concrete provider.
// =============================================================================
import {
  DIMENSIONS, TAILORED,
  checkBrief, coachQuestions, contentQuestionIds, mergesAudienceGoal, figuresQuestion,
} from "../../js/brief-check.js";

/** Wall-clock budget for the whole call, including any wait for a CLI slot.
 *  Measured 2026-10-20: the Haiku call takes ~19s through the CLI. */
export const COACH_TIMEOUT_MS = 30_000;

const MAX_QUESTION_CHARS = 200;
const MAX_PLACEHOLDER_CHARS = 120;
const MAX_OPTION_CHARS = 90;
const MAX_OPTIONS = 5;

export class BriefService {
  constructor(provider, { timeoutMs = COACH_TIMEOUT_MS } = {}) {
    this.provider = provider;
    this.timeoutMs = timeoutMs;
  }

  /** Backs POST /api/briefs/coach. Always questions, never a model error. */
  async coach(_context, { prompt, hasReferences = false } = {}) {
    if (typeof prompt !== "string" || !prompt.trim()) throw new Error("prompt is required.");

    const check = checkBrief(prompt);
    const fixed = coachQuestions(check, { hasReferences: hasReferences === true });
    const fallback = { questions: fixed, source: "fallback" };

    const ask = contentQuestionIds(check);
    const optional = check.figures ? [] : ["figures"];
    if (!ask.length && !optional.length) return fallback;

    let answer;
    try {
      answer = await withTimeout(
        this.provider.coachBrief({
          prompt, ask, optional, merged: mergesAudienceGoal(check), timeoutMs: this.timeoutMs,
        }),
        this.timeoutMs
      );
    } catch {
      return fallback;
    }
    if (!answer || answer.fallback || !Array.isArray(answer.questions)) return fallback;

    const tailored = cleanQuestions(answer.questions, new Set([...ask, ...optional]));
    if (!tailored.size) return fallback;

    const questions = fixed.map((q) => (tailored.has(q.id) ? merge(q, tailored.get(q.id)) : q));
    if (tailored.has("figures")) questions.push(merge(figuresQuestion(), tailored.get("figures")));
    return { questions, source: "model" };
  }
}

/** The model's wording over the fixed question; its options only when it gave some. */
function merge(q, t) {
  return {
    ...q,
    question: t.question,
    placeholder: t.placeholder || q.placeholder,
    options: t.options.length ? t.options : q.options,
  };
}

/** One entry per allowed id (the first), as plain, trimmed, bounded text. */
function cleanQuestions(raw, allowed) {
  const out = new Map();
  for (const item of raw) {
    const id = item?.id ?? item?.dimension;
    if (!allowed.has(id) || out.has(id) || !TAILORED.includes(id)) continue;
    const question = oneLine(item.question);
    if (!question || question.length > MAX_QUESTION_CHARS) continue;
    const placeholder = oneLine(item.placeholder);
    const labels = [];
    for (const o of Array.isArray(item.options) ? item.options : []) {
      const label = oneLine(o);
      if (!label || label.length > MAX_OPTION_CHARS || labels.includes(label)) continue;
      labels.push(label);
      if (labels.length >= MAX_OPTIONS) break;
    }
    out.set(id, {
      question,
      placeholder: placeholder && placeholder.length <= MAX_PLACEHOLDER_CHARS ? placeholder : "",
      options: labels.map((label) => ({ value: label, label })),
    });
  }
  return out;
}

const oneLine = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

/** Resolves or rejects with `promise`, or rejects at `ms` — whichever is first.
 *  The CLI's own timeout only starts once a slot frees up; this one starts now. */
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`The coach did not answer within ${ms}ms.`)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

/**
 * The `coaching` record stored on a generation for later analysis: what was
 * missing, what was asked, what was answered, where the questions came from,
 * and whether the person skipped. Anything else in the request is dropped.
 */
/** Question ids the coach can record: the checklist dimensions plus the two
 *  questions it always asks about the deck's shape (`hook`) and the person's
 *  material (`references`). */
export const COACH_QUESTION_IDS = [...DIMENSIONS, "hook", "references"];

export function sanitizeCoaching(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const dims = (v) => (Array.isArray(v) ? [...new Set(v.filter((d) => COACH_QUESTION_IDS.includes(d)))] : []);
  return {
    missing: dims(raw.missing),
    asked: dims(raw.asked),
    answered: dims(raw.answered),
    source: raw.source === "model" || raw.source === "fallback" ? raw.source : null,
    skipped: raw.skipped === true,
  };
}

const MAX_ANSWERS = 20;
const MAX_ANSWER_KEY_CHARS = 40;
const MAX_ANSWER_CHARS = 2000;

/**
 * The coach answers as given to content understanding: `{ id: text }`, string
 * values only, trimmed and clipped. The same answers are already folded into
 * the prompt; these are kept apart so the brief can say where a fact came from.
 */
export function sanitizeAnswers(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (Object.keys(out).length >= MAX_ANSWERS) break;
    if (typeof value !== "string" || !key || key.length > MAX_ANSWER_KEY_CHARS) continue;
    const text = value.trim().slice(0, MAX_ANSWER_CHARS);
    if (text) out[key] = text;
  }
  return out;
}
