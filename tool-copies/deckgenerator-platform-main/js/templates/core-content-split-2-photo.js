// Template: core/content-split-2-photo — a 4×2 grid of eight photo cards, each
// with a title and short body. Source Figma frame 109:5159.
import { frame } from "../frame.js";
import { cardGrid, SAMPLE } from "../blocks.js";

export default {
  name: "core/content-split-2-photo",
  slide: 13,
  figmaNode: "109:5159",
  family: "core", role: "content", shape: "split", count: 8, theme: "light", chrome: false,
  use: "Eight photo cards in a 4×2 grid, each with a title and short caption. A dense catalogue or highlights wall.",
  media: ["photo"],
  capacity: { items: 8, min: 6, max: 8 },
  slots: { images: 8, titles: 8, body: 8, stats: 0, icons: 0 },
  description: "core/content-split-2-photo — 4×2 grid of eight photo cards with title + body.",
  schema: {
    cards: "array of 8 { image, title, body }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    cards: SAMPLE.slice(0, 8).map((image) => ({
      image, title: "Title",
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "106" },
  },
  render(s) {
    return frame(cardGrid((s.cards || []).slice(0, 8), 4, false), { meta: s.meta, footer: s.footer });
  },
};
