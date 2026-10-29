// Template: main/split-06 — a single stacked horizontal bar: eyebrow + heading, a small
// legend, and one full-width pill split into coloured segments with a value above each.
// Source Figma frame 342:39992.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

const LEGEND = [
  { c: "var(--fill-petrol,#06041f)", t: "Lorem ipsum" },
  { c: "var(--fill-mid,#8893a5)", t: "Lorem ipsum" },
  { c: "var(--fill-grey,#c4c9d2)", t: "Lorem ipsum" },
];
const SEGMENTS = [
  { w: 66.5, c: "var(--fill-petrol,#06041f)", v: "64,2%" },
  { w: 16.7, c: "var(--fill-mid,#8893a5)", v: "64,2%" },
  { w: 16.7, c: "var(--fill-grey,#c4c9d2)", v: "64,2%" },
];

export default {
  name: "main/split-06", slide: -27, figmaNode: "342:39992",
  family: "main", role: "chart", shape: "chart", theme: "light", chrome: false,
  use: "A single stacked horizontal bar — heading, legend, and a full-width pill split into coloured segments with values.",
  media: [], capacity: { items: 4, min: 2, max: 6 },
  slots: { images: 0, titles: 1, body: 3, stats: 3, icons: 0 },
  description: "main/split-06 — eyebrow + heading + legend + one stacked horizontal pill bar.",
  intent: { bestFor: ["how one whole divides into a few parts, as one bar"], holds: "2–6 segments that add up to 100% of one whole", avoid: ["separate measures compared side by side (7 weeks vs 2 weeks)", "a before/after pair", "dates", "a single percentage"], feel: "data", needs: ["a share per segment of one whole"] },
  schema: {
    caption: "string — eyebrow", title: "string — heading",
    legend: "array of { c, t }", segments: "array of { w, c, v }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", legend: LEGEND, segments: SEGMENTS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const legend = s.legend || LEGEND;
    const segments = s.segments || SEGMENTS;
    /* A value label is ~24px a character at 36px bold; a segment narrower than
     * its label would print over its neighbour's ("1.5%" over "5.7%"). Narrow
     * segments take turns below the bar, and the last one hangs right-aligned
     * so it never runs off the slide. */
    let flip = false;
    const place = segments.map((g, i) => {
      const narrow = (Number(g.w) || 0) / 100 * 1840 < String(g.v ?? "").length * 24 + 16;
      if (!narrow) { flip = false; return ""; }
      flip = !flip;
      return `${flip ? " lo" : ""}${i === segments.length - 1 ? " end" : ""}`;
    });
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tblwrap reveal">
          ${pageHeader({ caption: s.caption, title: s.title ?? "" })}
          <div class="v2f-mn-t6">
            <div class="legend${legend.length > 3 ? " many" : ""}">
              ${legend.map((l) => `<div class="li"><span class="dot" style="background:${l.c};"></span><span>${esc(l.t)}</span></div>`).join("")}
            </div>
            <div class="bar">
              ${segments.map((g, i) => `<div class="seg${place[i]}" style="width:${g.w}%;">
                <span class="pct">${esc(g.v)}</span>
                <span class="fill" style="background:${g.c};"></span>
              </div>`).join("")}
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
