// Template: strategy/grid-05 — "Golden Circle": three concentric circles (Why/How/
// What) beside a right text column with three labelled blocks. Light theme.
// Source Figma frame 109:8959 (Strategy).
import { footerBar } from "../frame.js";
import { stConcentric, stTextCol } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-05",
  slide: 147,
  figmaNode: "109:8959",
  family: "strategy",
  role: "diagram",
  shape: "concentric-split",
  theme: "light",
  chrome: false,
  use: "A Golden-Circle / why-how-what model: three nested rings on the left, each expanded into a labelled paragraph block on the right.",
  media: [],
  capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "strategy/grid-05 — concentric why/how/what circles + right labelled text blocks.",
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    rings: "array of 3 ring labels [innermost, mid, outer]",
    blocks: "array of { label, text }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Golden Circle", subtitle: "Subtitle",
    rings: ["Title", "How", "What"],
    blocks: [
      { label: "Why we do what we do", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
      { label: "How we do it", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
      { label: "What we do", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "151" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-st-split reveal wtext">
        ${stConcentric({ labels: s.rings || [], mode: "axis" })}
        ${stTextCol({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, blocks: s.blocks, side: "right" })}
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
