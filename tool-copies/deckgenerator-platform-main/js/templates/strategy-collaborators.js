// Template: strategy/grid-08 — "Collaborators": a left text column beside five
// concentric rings centred on "You". Light theme.
// Source Figma frame 109:8997 (Strategy).
import { footerBar } from "../frame.js";
import { stTextCol, stConcentric } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-08",
  slide: 150,
  figmaNode: "109:8997",
  family: "strategy",
  role: "diagram",
  shape: "concentric-split",
  theme: "light",
  chrome: false,
  use: "A stakeholder-proximity model: concentric rings radiating out from the centre (you) through team, community and beyond, explained by a left text column.",
  media: [],
  capacity: { items: 4, min: 2, max: 5 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "strategy/grid-08 — left text column + concentric proximity rings centred on 'You'.",
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    center: "string — centre label", rings: "array of ring labels (inner → outer)",
    body: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Collaborators", subtitle: "Subtitle",
    center: "You",
    rings: ["Team", "Community", "Collaborators", "Researchers"],
    body: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "154" },
  },
  render(s) {
    // centre circle + rings → labels[0] is the (unlabelled) centre disc holding `center`.
    const labels = ["", ...(s.rings || [])];
    return `<div class="v2f-root">
      <div class="v2f-st-split reveal">
        ${stTextCol({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body, side: "left" })}
        ${stConcentric({ labels, mode: "bottom", centerLabel: s.center })}
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
