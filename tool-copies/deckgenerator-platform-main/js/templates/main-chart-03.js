// Template: main/chart-03 (was main/text-08: a chart, so renamed out of that series) — a bold positioning statement on the left with an intro, and a
// grouped column chart on the right (full-height tracks with a value fill from the bottom
// and a two-item legend). Source Figma frame 342:40011.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

// v = filled (dark) portion as % of the full track height.
const BARS = [
  { v: 21, cat: "Revenue Won" }, { v: 44, cat: "Revenue Won" },
  { v: 29, cat: "Revenue Won" }, { v: 58, cat: "Revenue Won" },
  { v: 7, cat: "Time Saved" },
];
const LEGEND = [
  { c: "var(--fill-petrol,#06041f)", t: "Without Mosaic" },
  { c: "var(--navy-300,#c4c9d2)", t: "With Mosaic" },
];

export default {
  name: "main/chart-03", slide: -26, figmaNode: "342:40011",
  family: "main", role: "chart", shape: "split", theme: "light", chrome: false,
  use: "A bold positioning statement with an intro on the left and a grouped column chart (value fill vs full track) on the right.",
  media: [], capacity: { items: 5, min: 3, max: 7 },
  slots: { images: 0, titles: 1, body: 2, stats: 5, icons: 0 },
  description: "main/chart-03 — bold statement + intro left, grouped column chart right.",
  intent: { bestFor: ["a few values against their maximum, beside a positioning statement"], holds: "3–7 labelled columns with a value and a full track", itemChars: 20, avoid: ["dates or milestones", "values without a common maximum"], feel: "data", needs: ["a value per item"] },
  schema: {
    title: "string — bold statement", body: "array of intro paragraph strings",
    bars: "array of { v, cat }  (v = % of track filled)", legend: "array of { c, t }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Nagarro is a global leader in technology and human-centered digital solutions.",
    body: [
      "Our clients need to become digital-first companies that compete through superior software platforms.",
      "Nagarro helps them transform, adapt, and build new ways into the  future through an entrepreneurial, agile, and caring mindset.",
    ],
    bars: BARS, legend: LEGEND,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    const bars = s.bars || BARS;
    const legend = s.legend || LEGEND;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tx8 reveal">
          <div class="side">
            ${s.title ? `<p class="stmt">${esc(s.title)}</p>` : ""}
            <div class="v2f-mn-prose airy">${body}</div>
          </div>
          <div class="chart">
            <div class="bars">
              ${bars.map((b) => `<div class="col">
                <span class="track"><span class="fill" style="height:${b.v}%;"></span></span>
                <span class="cat">${esc(b.cat)}</span>
              </div>`).join("")}
            </div>
            <div class="legend">
              ${legend.map((l) => `<div class="li"><span class="dot" style="background:${l.c};"></span><span>${esc(l.t)}</span></div>`).join("")}
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
