// =============================================================================
// Slide Review Service — visual review loop (smart-composition, Task 5).
//
// Both compose paths in generation-service.js build a deck against the
// templates' declared SCHEMA (does the field exist, is it the right shape),
// never against what the browser actually PAINTS. A capacity clamp keeps a
// six-item list out of a three-slot grid, but nothing upstream of this file
// notices when a merely-long string still runs past the bottom of its own
// panel, or a caption drifts off the right edge of the 1920x1080 stage. This
// is the pass that looks at the rendered pixels and fixes what it can.
//
// Reuses the exact measurement approach the audit tools already trust:
//   - Mounting: `window.__mountSlide({ template, theme, ...content }, {})`,
//     the same capture-page contract tools/audit-dead-space.mjs and
//     tools/audit-dark-mode.mjs already drive (CLAUDE.md's "verify your
//     detector" rule — these tools were each wrong at least once, so their
//     false-positive GUARDS are copied verbatim rather than re-derived).
//   - Dead-band gap measurement: same "filled box" + "centred" guards as
//     tools/audit-dead-space.mjs (skip anything under 200x260, anything
//     holding an <img>, and any gap that is matched by an equal gap above —
//     that is centring, not a hole).
//   - Off-canvas: the same leaf-text-node walk tools/audit-dark-mode.mjs uses
//     to find real, rendered text rather than layout boxes.
//
// Never fails the deck. Every failure mode here — Playwright missing, the
// capture page unreachable, a repair that doesn't render, the whole pass
// running long — degrades to returning the input unchanged, with a note()
// so the degradation is visible rather than silent (same posture as every
// other pass in generation-service.js).
// =============================================================================
import { config } from "../infrastructure/config.js";
import { findTemplate, prepareContentUpdate } from "./slide-content.js";
import {
  coerceToExample, clampToCapacity, clampText, ASSET_PATH, stripLorem, stripExampleLeftovers,
} from "./generation-service.js";
import { retentionOf, MIN_RETENTION } from "./content-retention.js";

/** At most this many of the worst-scoring slides get a repair attempt per
 *  pass. A whole deck of defects would otherwise turn one review into a
 *  second full compose pass — this is meant to fix the outliers, not
 *  re-lay-out the deck. */
export const MAX_REPAIRS = 4;

/** Below this, an empty vertical run inside a panel is normal breathing
 *  room, not a hole — same floor tools/audit-dead-space.mjs uses for its own
 *  "worth reporting" cut, chosen there because it is well past what any
 *  template deliberately leaves under a short answer. */
const DEAD_BAND_THRESHOLD = 300;

/** How much a repair may shrink the tightened-budget fallback's prose,
 *  relative to the template's own example length. Smaller than
 *  clampToCapacity's own 1.4x allowance (generation-service.js) on purpose:
 *  that clamp exists to catch routine overflow before it ever renders; this
 *  one runs AFTER a slide has already been proven too big for its layout, so
 *  it has to cut harder to change the outcome. */
const TIGHTEN_FACTOR = 0.8;

/** Hard ceiling on the whole review pass, matching the spec's time-box.
 *  `Promise.race`d against the real work below; `browser.close()` always
 *  runs in the `finally`, whichever side of the race wins, so a slow page
 *  never leaves an orphaned Chromium process behind. */
const HARD_TIMEOUT_MS = 180_000;

const CAPTURE_PATH = "/product/export-runtime/capture.html";

/** Overflow at or under this many pixels is inside a text box's own line box. */
const OVERFLOW_TOLERANCE_PX = 16;

/**
 * Defect score for one measurement. Only overflow and off-canvas pixels are
 * penalised at full weight — both are unambiguous rendering failures. A dead
 * band only counts past its 300px "that's just breathing room" floor, and
 * only the excess counts, so a 320px gap barely registers while an 900px one
 * dominates the ranking.
 *
 * @param {{overflowPx?: number, offCanvasPx?: number, deadBandPx?: number}} m
 * @returns {number}
 */
export function defectScore(m) {
  const overflowPx = Number(m?.overflowPx) || 0;
  const offCanvasPx = Number(m?.offCanvasPx) || 0;
  const deadBandPx = Number(m?.deadBandPx) || 0;
  // Under OVERFLOW_TOLERANCE_PX a box is a few pixels taller than its text
  // (line-height, a descender). On a live import that was the whole of four
  // "could not be repaired" warnings: the slides rendered cleanly, and the
  // repair could not shrink a box to nothing. Only overflow the eye can see counts.
  const visibleOverflow = Math.max(0, overflowPx - OVERFLOW_TOLERANCE_PX);
  return visibleOverflow * 3 + offCanvasPx * 3 + Math.max(0, deadBandPx - DEAD_BAND_THRESHOLD);
}

/**
 * Ranks measurements worst-first and keeps only the ones actually worth
 * fixing.
 *
 * @param {Array<{score: number}>} measurements
 * @param {number} max
 * @returns {Array<{score: number}>} the worst `max`, score descending
 */
export function pickWorst(measurements, max) {
  return (measurements || [])
    .filter((m) => (m?.score ?? 0) > 0)
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, max));
}

/**
 * Which of two candidate outcomes to keep. Strictly lower score wins; a tie
 * (including `after` being absent, e.g. a re-measure that threw) keeps
 * `before` — a repair that made no measurable difference is not worth the
 * risk of having changed the slide's content for nothing.
 *
 * @param {{score: number}} before
 * @param {{score: number}=} after
 */
export function betterOf(before, after) {
  if (!after || !(after.score < before.score)) return before;
  return after;
}

/** Strips the candidate-template list composition threaded onto a built
 *  slide so this repair pass has alternates to try. Never persisted — every
 *  return path in `reviewSlides` runs its result through this first. */
function stripShortlist(slide) {
  if (!slide || typeof slide !== "object") return slide;
  const { __shortlist, ...rest } = slide;
  return rest;
}

function cloneSlides(slides) {
  return slides.map((s) => ({ ...s }));
}

/**
 * Rebuilds `sourceContent` onto a different template, via the identical
 * coerceToExample -> clampToCapacity -> prepareContentUpdate path
 * `composeSlides`'s own `build()` closure uses the first time a slide is
 * laid out (generation-service.js). Reusing it means a repaired slide is
 * proven to render exactly like a freshly-composed one — never a
 * hand-rolled merge that only looks equivalent.
 */
function rebuildOnTemplate(templateName, sourceContent) {
  const t = findTemplate(templateName);
  if (!t) return null;
  try {
    const example = t.example || {};
    const coerced = coerceToExample(example, sourceContent || {});
    const clamped = clampToCapacity(t, coerced);
    const { content } = prepareContentUpdate(templateName, example, clamped);
    return { template: t, content };
  } catch {
    return null;
  }
}

/** Shrinks every prose field to TIGHTEN_FACTOR of the template's own example
 *  length — the fallback repair when the slide has no shortlisted alternate
 *  to try. Mirrors clampToCapacity's string-budget branch (same ASSET_PATH
 *  guard, so an image path is never mistaken for prose and truncated). */
function tightenContent(template, content) {
  const example = template?.example || {};
  const out = { ...(content || {}) };
  for (const [field, value] of Object.entries(out)) {
    const ex = example[field];
    if (typeof value === "string" && typeof ex === "string" && ex.length && !ASSET_PATH.test(ex)) {
      out[field] = clampText(value, Math.max(1, Math.round(ex.length * TIGHTEN_FACTOR)));
    }
  }
  return out;
}

/** Every string leaf in a slide's own content, joined — the "what this slide
 *  actually says" text that a repair must not lose. Mirrors the `walk` inside
 *  retentionOf (same meta/footer exclusion, so chrome never inflates the
 *  count) but produces a string, since retentionOf itself wants source TEXT,
 *  not a pre-built word set. */
function contentText(content) {
  const parts = [];
  const walk = (v) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v)) if (k !== "meta" && k !== "footer") walk(val);
    }
  };
  walk(content);
  return parts.join(" ");
}

/**
 * One repair attempt for one slide. Prefers a shortlisted alternate template
 * (a defect is often "the wrong layout for this much content", which a
 * different template solves outright); falls back to tightening the current
 * template's own budgets when there is no alternate, or none of them build.
 *
 * A rebuilt alternate is only accepted if it keeps enough of the slide's own
 * wording — coerceToExample's merge base is the ALTERNATE template's own
 * example, so a rebuild onto a template with fewer fields than the current
 * one silently drops whatever doesn't fit and keeps rendering the
 * alternate's own placeholder copy for the rest. Gated with the same
 * retention machinery the compose path (generation-service.js) uses to catch
 * exactly this failure the first time a slide is built, so a "repair" can
 * never make a slide worse than the defect it was meant to fix.
 *
 * @param {object} slide
 * @param {number} index         slide's position, for the reject note
 * @param {(msg: string) => void} say
 * @returns {object|null} a new slide object, or null if nothing could be built
 */
function repairSlide(slide, index, say) {
  const shortlist = Array.isArray(slide.__shortlist) ? slide.__shortlist : [];
  const currentName = slide.templateReference?.templateName;
  const alternates = shortlist.filter((n) => n && n !== currentName);
  const sourceText = contentText(slide.content);

  // Reported once per slide, not once per candidate: a slide with eleven
  // rejected alternates used to print the same line eleven times.
  let lostContent = false;
  for (const name of alternates) {
    const rebuilt = rebuildOnTemplate(name, slide.content);
    if (!rebuilt) continue;
    // Same lorem/example-leftover strippers the compose path runs over
    // freshly-built content, so an accepted repair is held to the identical
    // "no placeholder copy ships" bar as a slide built the first time.
    const cleaned = stripExampleLeftovers(stripLorem(rebuilt.content), rebuilt.template.example || {});
    if (retentionOf(sourceText, cleaned) < MIN_RETENTION) {
      lostContent = true;
      continue;
    }
    return {
      ...slide,
      templateReference: { ...slide.templateReference, templateName: name },
      content: cleaned,
    };
  }
  if (lostContent) say(`Slide ${index + 1}'s defect could not be repaired without losing content.`);
  if (!currentName) return null;
  const t = findTemplate(currentName);
  if (!t) return null;
  try {
    const tightened = tightenContent(t, slide.content);
    const { content } = prepareContentUpdate(currentName, t.example || {}, tightened);
    return { ...slide, content: stripExampleLeftovers(stripLorem(content), t.example || {}) };
  } catch {
    return null;
  }
}

/**
 * Runs `measureFn` over every slide, repairs the worst `MAX_REPAIRS`, and
 * returns the (possibly patched) working array. Shared by both the real
 * Playwright path and the test-injected `measure` path below — the only
 * difference between them is how `measureFn` is produced.
 *
 * @param {object[]} input
 * @param {(slide: object, index: number) => Promise<object>|object} measureFn
 * @param {(msg: string) => void} say
 * @param {(patch: object) => void} beat
 */
async function runReview(input, measureFn, say, beat) {
  const working = cloneSlides(input);

  const measureOne = async (slide, index) => {
    const m = await measureFn(slide, index);
    return { index, score: defectScore(m), metrics: m };
  };

  const measurements = [];
  for (let i = 0; i < working.length; i++) {
    measurements.push(await measureOne(working[i], i));
  }

  const worst = pickWorst(measurements, MAX_REPAIRS);
  if (!worst.length) return working;

  beat({
    stage: "reviewing",
    detail: `Reviewing ${working.length} slide${working.length === 1 ? "" : "s"} — ${worst.length} need${worst.length === 1 ? "s" : ""} a repair`,
  });

  // No `continue` in this loop: every branch below falls through to the one
  // `beat()` at the bottom, so progress ticks once per attempted slide no
  // matter how the attempt ends — an unrepairable slide or a failed
  // re-measure used to `continue` straight past it, which meant a UI
  // watching `tick()` would stall mid-review on exactly the slides that
  // most needed a visible verdict.
  for (const w of worst) {
    const before = { slide: working[w.index], score: w.score };
    const repaired = repairSlide(working[w.index], w.index, say);
    if (!repaired) {
      say(`Slide ${w.index + 1}: a visual defect (score ${w.score}) could not be repaired automatically.`);
    } else {
      let after;
      try {
        const remeasured = await measureOne(repaired, w.index);
        after = { slide: repaired, score: remeasured.score };
      } catch (err) {
        say(`Slide ${w.index + 1}: the repair could not be verified (${err.message}) — kept the original layout.`);
      }
      if (after) {
        const winner = betterOf(before, after);
        if (winner === after) {
          working[w.index] = repaired;
          say(`Slide ${w.index + 1}: repaired a visual defect (score ${w.score} to ${after.score}).`);
        } else {
          say(`Slide ${w.index + 1}: a visual defect (score ${w.score}) did not improve after repair — kept the original layout.`);
        }
      }
    }
    beat({ stage: "reviewing", detail: `Reviewed slide ${w.index + 1} of ${working.length}` });
  }

  return working;
}

/** Runs, in-page, against the mounted `.stage`. A plain top-level function —
 *  Playwright serialises it into the page's own context, so it cannot close
 *  over anything from this module; every threshold it needs is a literal.
 *
 *  Mirrors tools/audit-dead-space.mjs's box/gap logic and
 *  tools/audit-dark-mode.mjs's leaf-text-node walk — see this file's header
 *  for why those specific guards exist and must not be re-derived. */
function measureInPage() {
  const stage = document.querySelector(".stage");
  if (!stage) return { overflowPx: 0, offCanvasPx: 0, deadBandPx: 0 };

  // ---- overflow: max positive (scrollHeight - clientHeight), skip the root ----
  let overflowPx = 0;
  for (const el of stage.querySelectorAll("*")) {
    const over = el.scrollHeight - el.clientHeight;
    if (over > overflowPx) overflowPx = over;
  }

  // ---- off-canvas: max bottom/right beyond 1080/1920 of visible LEAF text ----
  let offCanvasPx = 0;
  for (const el of stage.querySelectorAll("*")) {
    if (el.children.length || !(el.textContent || "").trim()) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    offCanvasPx = Math.max(offCanvasPx, r.bottom - 1080, r.right - 1920);
  }
  offCanvasPx = Math.max(0, offCanvasPx);

  // ---- dead band: largest empty vertical run inside a drawn "panel" ----
  // Same false-positive guards as tools/audit-dead-space.mjs: a box only
  // counts when it is actually painted (fill or border) and big enough to
  // read as a panel; a photo fills its own box; a mark can be drawn purely
  // by its background (a waffle dot); a gap matched by an equal gap ABOVE
  // the content is centring, not a hole.
  const boxes = [];
  for (const el of stage.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    const filled = (cs.backgroundColor && !/rgba?\([^)]*,\s*0\)/.test(cs.backgroundColor)) ||
                   (cs.borderTopWidth !== "0px" && cs.borderTopStyle !== "none");
    if (!filled) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 200 || r.height < 260) continue;
    if (el.querySelector("img")) continue;
    boxes.push({ el, r });
  }
  let deadBandPx = 0;
  for (const { el, r } of boxes) {
    let lowest = r.top;
    let highest = r.bottom;
    for (const child of el.querySelectorAll("*")) {
      const t = (child.textContent || "").trim();
      const tag = child.tagName.toLowerCase();
      const ccs = getComputedStyle(child);
      const painted = (ccs.backgroundColor && !/rgba?\([^)]*,\s*0\)/.test(ccs.backgroundColor)) ||
                      (ccs.backgroundImage && ccs.backgroundImage !== "none");
      const drawn = tag === "img" || tag === "svg" || tag === "canvas" || painted;
      if (!t && !drawn && !child.querySelector("img, svg, canvas")) continue;
      const cr = child.getBoundingClientRect();
      if (cr.height === 0 || cr.width === 0) continue;
      if (cr.bottom > lowest) lowest = cr.bottom;
      if (cr.top < highest) highest = cr.top;
    }
    const cs = getComputedStyle(el);
    const gap = r.bottom - (parseFloat(cs.paddingBottom) || 0) - lowest;
    const above = highest - (r.top + (parseFloat(cs.paddingTop) || 0));
    const centred = above >= gap * 0.6;
    if (gap > deadBandPx && !centred) deadBandPx = gap;
  }

  return {
    overflowPx: Math.round(overflowPx),
    offCanvasPx: Math.round(offCanvasPx),
    deadBandPx: Math.round(Math.max(0, deadBandPx)),
  };
}

/**
 * Measures every built slide against the rendered page and repairs the
 * worst hard defects. Never fails the deck: any guard failure (Playwright
 * missing, the capture page unreachable, the pass running past its time
 * box) returns `slides` unchanged, minus the `__shortlist` scratch field
 * every path strips before returning.
 *
 * @param {object[]} slides  final, built slides (post divider-insertion/reindex)
 * @param {object} opts
 * @param {string=} opts.title   unused today, threaded for parity with the
 *   other passes and in case a future repair needs deck-level chrome
 * @param {(msg: string) => void=} opts.note
 * @param {(patch: object) => void=} opts.tick
 * @param {string=} opts.origin  capture page origin; defaults to
 *   `http://127.0.0.1:${config.port}` (the server this process is part of)
 * @param {(slide: object, index: number) => Promise<object>|object=} opts.measure
 *   test-injection hook — when present, this exact function measures every
 *   slide and Playwright is never touched. Production code leaves it unset.
 * @returns {Promise<object[]>}
 */
export async function reviewSlides(slides, opts = {}) {
  const say = typeof opts.note === "function" ? opts.note : () => {};
  const beat = typeof opts.tick === "function" ? opts.tick : () => {};
  const input = Array.isArray(slides) ? slides : [];
  if (!input.length) return input.map(stripShortlist);

  if (typeof opts.measure === "function") {
    try {
      const result = await runReview(input, opts.measure, say, beat);
      return result.map(stripShortlist);
    } catch (err) {
      say(`Visual review skipped: ${err.message}`);
      return input.map(stripShortlist);
    }
  }

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    say(`Visual review skipped: Playwright is not available (${err.message}).`);
    return input.map(stripShortlist);
  }

  const captureOrigin = opts.origin || `http://127.0.0.1:${config.port}`;
  const captureUrl = `${captureOrigin}${CAPTURE_PATH}`;

  let browser;
  try {
    const timeout = new Promise((_, reject) => {
      const id = setTimeout(() => reject(new Error("visual review timed out after 180s")), HARD_TIMEOUT_MS);
      id.unref?.();
    });

    const work = (async () => {
      browser = await chromium.launch();
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      await page.goto(captureUrl, { waitUntil: "load" });

      const measureFn = async (slide) => {
        const mountArg = {
          template: slide?.templateReference?.templateName,
          theme: slide?.themeOverride || "light",
          ...(slide?.content || {}),
        };
        const mounted = await page.evaluate((s) => window.__mountSlide(s, {}), mountArg);
        if (!mounted?.ok) return { overflowPx: 0, offCanvasPx: 0, deadBandPx: 0 };
        return page.evaluate(measureInPage);
      };

      return runReview(input, measureFn, say, beat);
    })();
    // If `timeout` wins the race, `work` is still running underneath —
    // `browser.close()` below will cut it off, but that close can itself
    // land in the middle of an in-flight `page.evaluate`, which rejects
    // `work` AFTER this function has already returned via the timeout
    // branch. Nothing here would ever await `work` again, so an unobserved
    // rejection on it is a Node `unhandledRejection`, not a bug in the
    // review logic. This attaches a handler purely to mark it observed;
    // `Promise.race` below still gets the real rejection/resolution from the
    // very same `work` promise, since a `.catch` here returns a NEW derived
    // promise rather than consuming the original one.
    work.catch(() => {});

    const result = await Promise.race([work, timeout]);
    return result.map(stripShortlist);
  } catch (err) {
    say(`Visual review skipped: ${err.message}`);
    return input.map(stripShortlist);
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* best effort */ }
    }
  }
}
