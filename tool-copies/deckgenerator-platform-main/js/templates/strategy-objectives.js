// Template: strategy/grid-02 — "Objectives": a split head (title + right body) over
// three chevron-bulleted cards. Light theme. Source Figma frame 109:8813.
import { frame } from "../frame.js";
import { stSplitHead, stCards } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-02",
  slide: 143,
  figmaNode: "109:8813",
  family: "strategy",
  role: "cards",
  shape: "row",
  theme: "light",
  chrome: false,
  use: "Phased objectives: three (or more) cards — one per year / horizon — each with a short chevron-bulleted list of goals.",
  media: [],
  capacity: { items: 3, min: 2, max: 4 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "strategy/grid-02 — split head + a row of chevron-bulleted objective cards.",
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    body: "string — intro paragraph",
    cards: "array of { title, items:[string] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Objectives", subtitle: "Subtitle",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    cards: [
      { title: "Year 1", items: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"] },
      { title: "Year 2", items: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"] },
      { title: "Year 3", items: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "147" },
  },
  render(s) {
    const middle =
      stSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }) +
      stCards(s.cards || [], { marker: "chevron" });
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
