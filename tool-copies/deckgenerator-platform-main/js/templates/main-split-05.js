// Template: main/split-05 — a donut/ring chart: eyebrow + heading over a three-segment
// ring with a big centre percentage and three legend blocks. Source Figma 342:39971.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

// f = fraction of the ring; legend placed at { left, top } px within the chart row.
const SEGMENTS = [
  { f: 0.642, color: "var(--navy-500,#8893a5)", n: "Name", d: "Description goes here", left: 1256, top: 300 },
  { f: 0.212, color: "var(--navy-300,#c4c9d2)", n: "Name", d: "Description goes here", left: 300, top: 360 },
  { f: 0.134, color: "var(--fill-petrol,#06041f)", n: "Name", d: "Description goes here", left: 520, top: 10 },
];

const R = 294, C = 2 * Math.PI * R, GAP = 10;

export default {
  name: "main/split-05", slide: -28, figmaNode: "342:39971",
  family: "main", role: "chart", shape: "chart", theme: "light", chrome: false,
  use: "A donut/ring chart — heading over a three-segment ring with a centre percentage and legends.",
  media: [], capacity: { items: 3, min: 2, max: 5 },
  slots: { images: 0, titles: 1, body: 3, stats: 1, icons: 0 },
  description: "main/split-05 — eyebrow + heading + 3-segment donut with centre value + legends.",
  intent: { bestFor: ["how one whole divides into two to five parts, with a headline share"], holds: "2–5 segments that add up to 100%", avoid: ["values that are not parts of one whole", "separate measures"], feel: "data", needs: ["a share per segment"] },
  schema: {
    caption: "string — eyebrow", title: "string — heading", center: "string — centre value",
    segments: "array of { f, color, n, d, left, top }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", center: "64,2%", segments: SEGMENTS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const segs = s.segments || SEGMENTS;
    let cum = 0;
    const arcs = segs.map((g) => {
      const len = g.f * C - GAP;
      const off = -cum * C;
      cum += g.f;
      return `<circle cx="310" cy="310" r="${R}" fill="none" stroke="${g.color}" stroke-width="31" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${off}"/>`;
    }).join("");
    const legends = segs.map((g) => `
      <div class="lg" style="left:${g.left}px;top:${g.top}px;">
        <span class="dot" style="background:${g.color};"></span>
        <div class="lg-t"><p class="n">${esc(g.n)}</p><p class="d">${esc(g.d)}</p></div>
      </div>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tblwrap reveal">
          ${pageHeader({ caption: s.caption, title: s.title ?? "" })}
          <div class="v2f-mn-t5">
            <div class="donut">
              <svg viewBox="0 0 620 620"><g transform="rotate(-90 310 310)">${arcs}</g></svg>
              <span class="ctr">${esc(s.center ?? "")}</span>
            </div>
            ${legends}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
