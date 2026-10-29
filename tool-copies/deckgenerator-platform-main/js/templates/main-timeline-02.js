// Template: main/timeline-02 — a simple two-phase week timeline: dashed week columns
// with a grey "workshop" block (title + subtitle) and a dark "sprint" block on a lower
// row. Source Figma frame 342:39724.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4"];
// l/w = % of width; top/h in px (top already includes the 56px header offset).
const BLOCKS = [
  { label: "Workshop", sub: "Project Steps / Points go here", l: 0, w: 50, top: 70, h: 120, kind: "grey" },
  { label: "Sprint 3", l: 50, w: 50, top: 190, h: 80, kind: "dark" },
];

export default {
  name: "main/timeline-02", slide: -33, figmaNode: "342:39724",
  family: "main", role: "timeline", shape: "single", theme: "light", chrome: false,
  use: "A two-phase week timeline — dashed week columns with a grey workshop block and a dark sprint block.",
  media: [], capacity: { items: 4, min: 2, max: 6 },
  slots: { images: 0, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "main/timeline-02 — week columns + a workshop block (title+sub) and a sprint block.",
  schema: {
    weeks: "array of column labels",
    blocks: "array of { label, sub?, l, w, top, h, kind:'grey'|'dark' }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    weeks: WEEKS, blocks: BLOCKS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const weeks = s.weeks || WEEKS;
    const blocks = s.blocks || BLOCKS;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tl reveal">
          <div class="cols">
            ${weeks.map((w) => `<div class="wk"><span>${esc(w)}</span></div>`).join("")}
          </div>
          <div class="blocks">
            ${blocks.map((b) => `<span class="blk ${b.kind}" style="left:${b.l}%;width:${b.w}%;top:${b.top}px;height:${b.h}px;">
              <span class="t">${esc(b.label)}</span>
              ${b.sub ? `<span class="s">${esc(b.sub)}</span>` : ""}
            </span>`).join("")}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
