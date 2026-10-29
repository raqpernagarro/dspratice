// Template: strategy/cover — "Propositions": a split head over a row of five text
// cards (one highlighted). Light theme. Source Figma frame 109:8785 (Strategy).
import { frame } from "../frame.js";
import { stSplitHead, stCards } from "../strategy-blocks.js";

export default {
  name: "strategy/cover",
  slide: 140,
  figmaNode: "109:8785",
  family: "strategy",
  role: "cards",
  shape: "row",
  theme: "light",
  chrome: false,
  use: "A propositions / options wall: a caption+title head over up to five parallel text cards, one of which can be highlighted as the chosen option.",
  media: [],
  capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "strategy/cover — split head + a row of five bulleted proposition cards (one active).",
  schema: {
    caption: "string — eyebrow", title: "string — display title", subtitle: "string — muted 2nd line",
    cards: "array of { title, items:[string], active:boolean }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Propositions", subtitle: "Subtitle",
    cards: [1, 2, 3, 4, 5].map((n) => ({
      title: "Lorem ipsum",
      active: n === 3,
      items: [
        "Lorem ipsum dolor sit.",
        "Nunc scelerisque viverra mauris in.",
        "Aliquam eleifend mi in nulla posuere sollicitudin aliquam ultrices sagittis.",
      ],
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "144" },
  },
  render(s) {
    const middle =
      stSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle }) +
      stCards(s.cards || [], { marker: "disc" });
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
