// The hard filter: which photos can PHYSICALLY go in this slot.
// Everything softer (theme, mood, deck coherence) is the selection model's job.
// Pure — no I/O, no API, no manifest loading.

export function filterCandidates(photos, slot) {
  const req = slot?.requires ?? {};
  return photos.filter((p) => {
    if (req.text_safe === true && p.text_safe !== true) return false;
    if (req.busyness && !req.busyness.includes(p.busyness)) return false;
    if (req.brightness && !req.brightness.includes(p.brightness)) return false;
    if (req.orientation && !req.orientation.includes(p.orientation)) return false;
    if (req.people) {
      if (req.people.count !== undefined && p.people?.count !== req.people.count) return false;
      if (req.people.framing && !req.people.framing.includes(p.people?.framing)) return false;
    }
    return true;
  });
}

/**
 * Progressive widening for empty pools. Drops the softest requirement first and
 * retries, so a slot ends up with something rather than nothing.
 *
 * `text_safe` and `orientation` are correctness constraints, not aesthetic
 * preferences — dropping either produces a visibly broken slide (illegible
 * overlaid type, or a landscape photo jammed into a portrait slot). They are
 * NEVER relaxed and do not appear in RELAX_ORDER. If the pool is still empty
 * after widening every soft preference, `filterWithWidening` returns an empty
 * `photos` array — the caller is expected to fall back (e.g. skip the slot or
 * use a default asset) rather than accept an unusable photo.
 *
 * Returns { photos, dropped } — `dropped` names the requirements sacrificed, for logging.
 */
export const RELAX_ORDER = ["brightness", "busyness", "people"];

export function filterWithWidening(photos, slot) {
  let candidates = filterCandidates(photos, slot);
  const dropped = [];
  const requires = { ...(slot?.requires ?? {}) };

  for (const key of RELAX_ORDER) {
    if (candidates.length > 0) break;
    if (!(key in requires)) continue;
    delete requires[key];
    dropped.push(key);
    candidates = filterCandidates(photos, { ...slot, requires });
  }

  return { photos: candidates, dropped };
}
