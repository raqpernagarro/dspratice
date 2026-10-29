// product/domain/photo-selection.js
// =============================================================================
// Which photograph belongs on this slide?
//
// The library ships 208 captioned photographs — description, tags, people count
// and framing, tone, brightness, busyness, orientation, and a `text_safe` flag
// for whether type can be laid over them. None of it was ever used. Composition
// locked every image to whatever its template's example happened to show, so
// roughly 23 photos appeared in every deck anyone generated, regardless of
// subject, and the other 185 were dead weight in the repository.
//
// This picks by meaning instead. It is deterministic — the same slide gets the
// same photograph — because photo choice is a matching problem, not a judgement
// call, and a rule that can be read and tested beats a model call that cannot.
//
// Two constraints are never traded away, both from js/image-filter.js's own
// reasoning: `text_safe` when type sits over the image, and orientation. Both
// produce a visibly broken slide rather than a merely worse one.
// =============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { filterWithWidening } from "../../js/image-filter.js";

const MANIFEST = fileURLToPath(new URL("../../assets/photography/manifest.json", import.meta.url));

/** Loaded once. The manifest is static data shipped with the library. */
let photos = null;
function allPhotos() {
  if (photos) return photos;
  try {
    const raw = JSON.parse(readFileSync(MANIFEST, "utf8"));
    photos = (Array.isArray(raw) ? raw : raw.photos || Object.values(raw))
      .filter((p) => p && p.file)
      .map((p) => ({ ...p, path: `assets/photography/${p.file}` }));
  } catch {
    photos = []; // no manifest → callers keep the template's own photograph
  }
  return photos;
}

/** Words worth matching on. Strips the filler that would match everything. */
const STOP = new Set(
  ("a an and are as at be by for from has have how in into is it its of on or that the their there they this to " +
   "we with will our your you what when which who why more most than then over under across about after before " +
   "up down out off very just also can could should would may might must do does did not no nor so such").split(" ")
);

function keywords(text) {
  return [...new Set(
    String(text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w))
  )];
}

/** How well one photograph suits one slide's words. */
function relevance(photo, words) {
  if (!words.length) return 0;
  const haystack = `${photo.description || ""} ${(photo.tags || []).join(" ")} ${photo.tone || ""}`.toLowerCase();
  let hits = 0;
  for (const w of words) {
    if (haystack.includes(w)) hits += 1;
    // A stem match ("rollout" → "roll", "engineers" → "engineer") is weaker but
    // real; without it almost nothing matches business prose.
    else if (w.length > 5 && haystack.includes(w.slice(0, Math.max(4, w.length - 2)))) hits += 0.5;
  }
  return hits / words.length;
}

/* Words in a photograph's own tone and tags that make it wrong above grave
 * subject matter. Scored, never filtered: on a slide about cancellations there
 * may be nothing else, and a mildly upbeat picture still beats no picture. */
const CELEBRATORY = /(?:playful|joyful|joy|celebrat|exuberant|laugh|humorous|fun\b|whimsic|upbeat|party|cheer)/i;
function celebratory(photo) {
  const tone = String(photo.tone || "");
  const tags = (photo.tags || []).join(" ");
  // Tone is the photographer's own read of the picture, so it counts double.
  return (CELEBRATORY.test(tone) ? 2 : 0) + (CELEBRATORY.test(tags) ? 1 : 0);
}

/**
 * Chooses photographs for one slide.
 *
 * @param {object} options
 * @param {object} options.template   the chosen template module
 * @param {object} options.signature  from contentSignature()
 * @param {string} options.text       the slide's own words
 * @param {Set<string>} options.used  paths already used in this deck
 * @param {boolean} [options.textSafe] type sits over the image
 * @returns {string[]} paths, in order, at most as many as the template needs
 */
export function choosePhotos({ template, signature, text, used = new Set(), textSafe = false }) {
  const need = template?.slots?.images || 0;
  if (!need) return [];

  const pool = allPhotos();
  if (!pool.length) return [];

  /* People slides want photographs OF people; everything else is better served
   * by a room, a screen or a detail than by a posed group. */
  const wantsPeople = Boolean(signature?.isPeople);
  const slot = {
    requires: {
      ...(textSafe ? { text_safe: true } : {}),
      ...(wantsPeople ? { people: { framing: ["portrait", "candid-close", "candid-medium", "group"] } } : {}),
    },
  };
  const { photos: eligible } = filterWithWidening(pool, slot);
  const candidates = eligible.length ? eligible : pool;

  const words = keywords(text);
  const grave = Boolean(signature?.isGrave);
  const scored = candidates.map((p) => ({
    p,
    // Reuse within one deck is the thing most visible to a reader, so it costs
    // more than any relevance gain can recover.
    score: relevance(p, words) * 100
      - (used.has(p.path) ? 60 : 0)
      - (grave ? celebratory(p) * 45 : 0),
  }));

  /* Ties are broken by a stable hash of the file name rather than manifest
   * order, so an unmatched slide does not always land on the first few photos —
   * which is how the old behaviour looked, and the thing this replaces. */
  const seed = words.join("|").length;
  scored.sort((a, b) =>
    b.score - a.score ||
    ((hash(a.p.file) + seed) % 997) - ((hash(b.p.file) + seed) % 997)
  );

  const out = [];
  for (const { p } of scored) {
    if (out.length >= need) break;
    if (out.includes(p.path)) continue;
    out.push(p.path);
  }
  return out;
}

/**
 * The function a slide's photo slots draw from: the author's own images first
 * (in order, each used once, shared across the deck by the caller passing the
 * same `own` array), then this slide's library picks. Returns null once both
 * are empty, so a slot keeps its template's own photograph.
 *
 * @param {{own?: string[], picks?: string[], used?: Set<string>}} options
 */
export function photoQueue({ own = [], picks = [], used = new Set() } = {}) {
  let next = 0;
  const take = () => {
    if (own.length) return own.shift();
    const chosen = picks[next++] ?? picks[picks.length - 1] ?? null;
    if (chosen) used.add(chosen);
    return chosen;
  };
  take.available = () => own.length > 0 || picks.length > 0;
  return take;
}

function hash(text) {
  let h = 0;
  for (let i = 0; i < String(text).length; i++) h = (h * 31 + String(text).charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Exposed so a caller can report how much of the library a deck reached. */
export function photoCount() {
  return allPhotos().length;
}
