// Template: main/chart-01 (was main/logos-06: a chart, so renamed out of that series) — a horizontal bar chart: pageHeader + legend on the left,
// a stack of labelled horizontal bars on the right. Source Figma frame 342:40091.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

// v = bar length as % of the longest bar; c = optional accent colour (default black).
const BARS = [
  { name: "Name", v: 100, c: "var(--navy-500,#8893a5)" },
  { name: "Name", v: 90.3 }, { name: "Name", v: 80.1 },
  { name: "Name", v: 62.6 }, { name: "Name", v: 53.0 },
  { name: "Name", v: 48.9, c: "var(--navy-300,#c4c9d2)" },
  { name: "Name", v: 46.7 }, { name: "Name", v: 30.9 },
  { name: "Name", v: 29.0 },
  { name: "Name", v: 27.9, c: "var(--navy-400,#a0a9b8)" },
  { name: "Name", v: 26.3 }, { name: "Name", v: 24.0 },
  { name: "Name", v: 20.5 }, { name: "Name", v: 17.5 }, { name: "Name", v: 11.5 },
];
const LEGEND = [
  { c: "var(--navy-500,#8893a5)", t: "Description 1" },
  { c: "var(--fill-petrol,#06041f)", t: "Description 2" },
  { c: "var(--navy-300,#c4c9d2)", t: "Description 3" },
  { c: "var(--navy-400,#a0a9b8)", t: "Description 4" },
];

export default {
  name: "main/chart-01", slide: -23, figmaNode: "342:40091",
  family: "main", role: "chart", shape: "chart", theme: "light", chrome: false,
  use: "A horizontal bar chart — heading + legend on the left, a stack of labelled bars ranked by length on the right.",
  media: [], capacity: { items: 15, min: 4, max: 16 },
  slots: { images: 0, titles: 1, body: 1, stats: 15, icons: 0 },
  description: "main/chart-01 — heading + legend left, ranked horizontal bars right.",
  intent: { bestFor: ["ranking many items by one value"], holds: "4–16 labelled bars on one scale", itemChars: 30, avoid: ["change over time", "dates or milestones"], feel: "data", needs: ["a value per item"] },
  schema: {
    caption: "string — eyebrow", title: "string — heading", intro: "string — intro paragraph",
    bars: "array of { name, v, c? }  (v = % of longest bar)",
    legend: "array of { c, t }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Trusted by global brands",
    intro: "We help our clients transform innovative ideas into inspiring brands, amazing products and cutting edge experiences that touch millions.",
    bars: BARS, legend: LEGEND,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const bars = s.bars || BARS;
    const legend = s.legend || LEGEND;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-lg6 reveal">
          <div class="side">
            ${pageHeader({ caption: s.caption, title: s.title ?? "", intro: s.intro })}
            <div class="legend">
              ${legend.map((l) => `<div class="li"><span class="dot" style="background:${l.c};"></span><span>${esc(l.t)}</span></div>`).join("")}
            </div>
          </div>
          <div class="bars">
            ${bars.map((b) => `<div class="row">
              <span class="nm">${esc(b.name)}</span>
              <span class="bar" style="width:${b.v}%;background:${b.c || "var(--fill-petrol,#06041f)"};"></span>
            </div>`).join("")}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
