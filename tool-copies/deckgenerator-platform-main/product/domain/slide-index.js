// product/domain/slide-index.js
// =============================================================================
// Page numbers on index and contents slides, set by the system.
//
// A drafted contents list carries page numbers written before dividers are
// inserted, so every number after the first divider is wrong. The page of each
// entry is found here, once the deck's final order is known: the first later
// slide whose heading matches the entry's label. An entry with no matching
// slide gets a blank page rather than a guessed one — a missing number is
// honest, a wrong number sends the audience to the wrong slide.
// =============================================================================

const STOP = new Set(["the", "and", "of", "for", "with", "to", "a", "an", "in", "on", "at", "by", "from", "our"]);

/** Heading text a slide is findable by. Never body copy: a label is a
 *  section name, and body copy mentions everything. */
const HEADING_FIELDS = ["title", "heading", "statement", "partner", "eyebrow", "caption", "subtitle", "name"];

const words = (text) => String(text || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .split(" ")
  .filter((w) => w && !STOP.has(w));

function headingWords(content = {}) {
  return new Set(HEADING_FIELDS.flatMap((k) => words(content[k])));
}

/**
 * True when at least 60% of the label's meaningful words appear in the heading
 * (and at least one does). "Core migration" matches "Core migration is on track".
 */
export function labelMatches(label, content) {
  const wanted = [...new Set(words(label))];
  if (!wanted.length) return false;
  const have = headingWords(content);
  const hits = wanted.filter((w) => have.has(w)).length;
  return hits >= 1 && hits >= Math.ceil(wanted.length * 0.6);
}

const pad = (n) => String(n).padStart(2, "0");

/**
 * @param {Array<{templateReference?: {templateName: string}, content?: object}>} slides
 *   the deck in its final order
 * @param {object} opts
 * @param {(templateName: string) => ({key: string, span?: boolean}|string|null)} opts.pageKeyFor
 *   which item field carries the page, and whether the layout shows page
 *   *ranges* (portfolio/index-02, main/index-02: "05 – 12") rather than the
 *   first page of each entry. A bare string is a key without ranges.
 * @param {(templateName: string) => boolean} [opts.isClosing]
 *   a range never runs onto the closing slide
 * @returns {typeof slides} a new array; slides that are not page indexes are untouched
 */
export function resolvePageIndexes(slides, { pageKeyFor, isClosing = () => false }) {
  return slides.map((slide, i) => {
    const name = slide?.templateReference?.templateName;
    const items = slide?.content?.items;
    const spec = name ? pageKeyFor(name) : null;
    const { key, span = false } = typeof spec === "string" ? { key: spec } : (spec || {});
    if (!key || !Array.isArray(items)) return slide;

    // The first later slide whose heading carries each label.
    const starts = items.map((item) => {
      if (!item || typeof item !== "object" || typeof item.label !== "string") return null;
      for (let j = i + 1; j < slides.length; j++) {
        if (labelMatches(item.label, slides[j]?.content)) return j;
      }
      return -1;
    });

    // A range ends where the next entry starts, and the last one at the last
    // slide before the closing.
    let last = slides.length - 1;
    if (last > i && isClosing(slides[last]?.templateReference?.templateName)) last--;
    const found = starts.filter((s) => s != null && s >= 0).sort((a, b) => a - b);
    const endOf = (start) => {
      const next = found.find((s) => s > start);
      return next != null ? next - 1 : last;
    };

    /* All or none. A contents list where two of five entries carry a page
     * reads as broken, not as partly helpful — the eye looks for the missing
     * numbers. When any entry has no slide to point at, no entry gets one. */
    const complete = starts.every((s) => s != null && s >= 0);

    const items2 = items.map((item, k) => {
      const start = starts[k];
      if (start == null) return item;
      if (start < 0 || !complete) return { ...item, [key]: "" };
      const end = span ? endOf(start) : start;
      return { ...item, [key]: end > start ? `${pad(start + 1)} – ${pad(end + 1)}` : pad(start + 1) };
    });
    return { ...slide, content: { ...slide.content, items: items2 } };
  });
}
