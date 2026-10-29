// Template: planning/grid-03 — "Phases": split head over four phase cards, one active.
// Source Figma frame 105:2704.
import { frame } from "../frame.js";
import { plSplitHead, plPhaseCards } from "../planning-blocks.js";

export default {
  name: "planning/grid-03", slide: 159, figmaNode: "105:2704",
  family: "planning", role: "cards", shape: "row", theme: "light", chrome: false,
  use: "A phased plan shown as a row of cards, with the current phase highlighted.",
  media: [], capacity: { items: 4, min: 3, max: 5 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "planning/grid-03 — split head + a row of phase cards, one active.",
  schema: {
    caption: "string", title: "string", subtitle: "string", body: "string — intro paragraph",
    cards: "array of { title, sub, active }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Phases", subtitle: "Subtitle",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    cards: [
      { title: "Phase 1", sub: "Lorem ipsum" },
      { title: "Phase 2", sub: "Lorem Ipsum", active: true },
      { title: "Phase 3", sub: "Lorem ipsum" },
      { title: "Phase 4", sub: "Lorem ipsum" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "62" },
  },
  render(s) {
    return frame(
      plSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }) +
      plPhaseCards(s.cards || []),
      { meta: s.meta, footer: s.footer });
  },
};
