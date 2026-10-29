// Template: planning/grid-09 — a dense photo milestone timeline (5 above / 5 below),
// no head. Source Figma frame 105:2826.
import { frame } from "../frame.js";
import { plMilestones, plScene } from "../planning-blocks.js";

export default {
  name: "planning/grid-09", slide: 165, figmaNode: "105:2826",
  family: "planning", role: "timeline", shape: "milestones", theme: "light", chrome: false,
  use: "A dense milestone timeline: ten photo moments stacked above and below the axis for a packed retrospective or roadmap.",
  media: ["photo"], capacity: { items: 10, min: 6, max: 10 },
  slots: { images: 10, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "planning/grid-09 — a full-bleed photo milestone timeline (5 above / 5 below).",
  schema: {
    above: "array of { image, title, body, active }", below: "array of { image, title, body, active }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    above: Array(5).fill(0).map((_, i) => ({ image: plScene(i), title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." })),
    below: Array(5).fill(0).map((_, i) => ({ image: plScene(i + 5), title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "68" },
  },
  render(s) {
    return frame(plMilestones({ above: s.above || [], below: s.below || [] }), { meta: s.meta, footer: s.footer });
  },
};
