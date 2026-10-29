// Template: main/timeline-01 — a week-column roadmap/gantt: dashed week columns with
// staggered rounded pill bars (a workshop span + cascading sprints). Source Figma 342:39696.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"];
// l/w are % of the full timeline width; row = stacking row (54px pitch).
const BARS = [
  { label: "Workshop", l: 0, w: 59.5, row: 0, kind: "grey" },
  { label: "Sprint 2", l: 59.5, w: 11.9, row: 1, kind: "dark" },
  { label: "Sprint 3", l: 71.4, w: 11.9, row: 2, kind: "dark" },
  { label: "Sprint 4", l: 83.3, w: 11.9, row: 3, kind: "dark" },
];

export default {
  name: "main/timeline-01", slide: -34, figmaNode: "342:39696",
  family: "main", role: "timeline", shape: "single", theme: "light", chrome: false,
  use: "A week-column roadmap/gantt — dashed week columns with staggered rounded pill bars.",
  media: [], capacity: { items: 6, min: 2, max: 8 },
  slots: { images: 0, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "main/timeline-01 — 8 week columns + staggered gantt pills.",
  schema: {
    weeks: "array of column labels",
    bars: "array of { label, l, w, row, kind:'grey'|'dark' }  (l/w are % of full width)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    weeks: WEEKS, bars: BARS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const weeks = s.weeks || WEEKS;
    const bars = s.bars || BARS;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tl reveal">
          <div class="cols">
            ${weeks.map((w) => `<div class="wk"><span>${esc(w)}</span></div>`).join("")}
          </div>
          <div class="bars">
            ${bars.map((b) => `<span class="bar ${b.kind}" style="left:${b.l}%;width:${b.w}%;top:${b.row * 54}px;">${esc(b.label)}</span>`).join("")}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
