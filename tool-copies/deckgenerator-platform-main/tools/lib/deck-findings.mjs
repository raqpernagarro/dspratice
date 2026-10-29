// tools/lib/deck-findings.mjs
// =============================================================================
// The two deck audits the intelligence layer added, as pure functions so the
// test suite can fire them on small fixtures (audit-decks.mjs is a script).
//
//   voice — the slide copy read against the voice rules (js/voice-lint.js),
//           in the same shape the generation's voice pass scores it
//           (lintShape: the title and the visible words, never the notes).
//   hook  — a prompt deck whose generation asked for a hook (wantsHook) but
//           whose slide 2 is not marked role:"hook". The marker is the hook's
//           identity; position alone says nothing.
// =============================================================================
import { lintDeck } from "../../js/voice-lint.js";
import { lintShape } from "../../product/domain/generation-service.js";

const number = (slide, i) => (slide?.order ?? i) + 1;

/** Every voice-lint finding on a stored deck, with 1-based slide numbers. */
export function voiceFindings(deck) {
  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  const { findings } = lintDeck(slides.map((s) => lintShape(s?.content || {})));
  return findings.map((f) => ({
    slide: number(slides[f.slide], f.slide),
    detail: `${f.kind} · ${JSON.stringify(String(f.text).slice(0, 80))}`,
  }));
}

/** The lintDeck score of a stored deck (the count of its voice findings). */
export function voiceScore(deck) {
  return voiceFindings(deck).length;
}

/**
 * A finding when a hook was asked for and slide 2 is not one; otherwise null.
 * Only an explicit `wantsHook: true` counts — records written before the hook
 * existed carry no field and are not judged against it. Imports and decks of
 * fewer than three slides never get a hook.
 */
export function hookFinding(deck, generation) {
  if (generation?.wantsHook !== true) return null;
  if (deck?.origin === "import") return null;
  const slides = Array.isArray(deck?.slides) ? [...deck.slides] : [];
  if (slides.length < 3) return null;
  slides.sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
  if (slides[1]?.role === "hook") return null;
  const elsewhere = slides.findIndex((s) => s?.role === "hook");
  return {
    slide: 2,
    detail: elsewhere === -1
      ? "a hook was asked for; no slide is marked role:\"hook\""
      : `a hook was asked for; the marked hook is slide ${elsewhere + 1}, not slide 2`,
  };
}
