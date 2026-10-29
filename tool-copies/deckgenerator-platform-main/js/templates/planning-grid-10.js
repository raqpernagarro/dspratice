// Template: planning/grid-10 — a dense photo milestone timeline with one moment
// highlighted, no head. Source Figma frame 105:2862.
import { frame } from "../frame.js";
import { plMilestones, plScene } from "../planning-blocks.js";

export default {
  name: "planning/grid-10", slide: 166, figmaNode: "105:2862",
  family: "planning", role: "timeline", shape: "milestones", theme: "light", chrome: false,
  use: "A dense milestone timeline that spotlights one moment among ten, the rest muted.",
  media: ["photo"], capacity: { items: 10, min: 6, max: 10 },
  slots: { images: 10, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "planning/grid-10 — a full-bleed photo milestone timeline (5 above / 5 below) with one active card.",
  schema: {
    above: "array of { image, title, body, active }", below: "array of { image, title, body, active }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    above: Array(5).fill(0).map((_, i) => ({ image: plScene(i), title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", active: i !== 1 ? false : undefined })),
    below: Array(5).fill(0).map((_, i) => ({ image: plScene(i + 5), title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", active: false })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "69" },
  },
  render(s) {
    return frame(plMilestones({ above: s.above || [], below: s.below || [] }), { meta: s.meta, footer: s.footer });
  },
};
