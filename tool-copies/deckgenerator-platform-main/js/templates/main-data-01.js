// Template: main/data-01 — a "leader" heading + intro on the left with a two-column
// grid of key figures (hairline-separated) on the right. Source Figma frame 342:37419.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const STATS = [
  { num: "25+", lbl: "Years" }, { num: "9.5+", lbl: "Satisfaction" },
  { num: "90%", lbl: "Repeat Business" }, { num: "NA9", lbl: "Public Listed Company" },
  { num: "25+", lbl: "Years" }, { num: "18,000+", lbl: "Colleagues" },
  { num: "40", lbl: "Countries" }, { num: "40", lbl: "Countries" },
];

export default {
  name: "main/data-01", slide: -61, figmaNode: "342:37419",
  family: "main", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A positioning statement with an intro on the left and a two-column grid of headline figures on the right.",
  media: [], capacity: { items: 8, min: 4, max: 8 },
  slots: { images: 0, titles: 1, body: 2, stats: 8, icons: 0 },
  description: "main/data-01 — heading + intro left, 2-column stat grid right.",
  schema: {
    title: "string — heading", body: "array of intro paragraph strings",
    stats: "array of { num, lbl }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Nagarro is a global leader in technology and human centered digital solutions.",
    body: [
      "Our clients need to become digital-first companies that compete through superior software platforms.",
      "Nagarro helps them transform, adapt, and build new ways into the future through an entrepreneurial, agile, and caring mindset.",
    ],
    stats: STATS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    const stats = (s.stats || STATS).map((st) => `
      <div class="v2f-mn-data1-stat">
        <p class="num">${esc(st.num)}</p><p class="lbl">${esc(st.lbl)}</p>
      </div>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-data1 reveal">
          <div class="v2f-mn-data1-left">
            ${s.title ? `<p class="v2f-mn-h">${esc(s.title)}</p>` : ""}
            <div class="v2f-mn-prose airy">${body}</div>
          </div>
          <div class="v2f-mn-data1-stats">${stats}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
