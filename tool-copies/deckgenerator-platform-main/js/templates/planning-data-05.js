// Template: planning/data-05 — "Propositions": a row of five bulleted cards, one
// highlighted. Source Figma frame 105:3624.
import { frame } from "../frame.js";
import { plSplitHead, plCards } from "../planning-blocks.js";

export default {
  name: "planning/data-05", slide: 176, figmaNode: "105:3624",
  family: "planning", role: "cards", shape: "row", theme: "light", chrome: false,
  use: "A propositions / options wall: a caption+title head over up to five parallel bulleted cards, one highlighted as chosen.",
  media: [], capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "planning/data-05 — split head + a row of five bulleted proposition cards (one active).",
  schema: {
    caption: "string", title: "string", subtitle: "string",
    cards: "array of { title, items:[string], active }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Propositions", subtitle: "Subtitle",
    cards: [1, 2, 3, 4, 5].map((n) => ({
      title: "Lorem ipsum", active: n === 3,
      items: ["Lorem ipsum dolor sit.", "Nunc scelerisque viverra mauris in.", "Aliquam eleifend mi in nulla posuere sollicitudin aliquam ultrices sagittis."],
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "79" },
  },
  render(s) {
    return frame(
      plSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle }) + plCards(s.cards || []),
      { meta: s.meta, footer: s.footer });
  },
};
