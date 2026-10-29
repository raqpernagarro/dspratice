// Template: core/cards-row-4 — header + four text cards in a row (no photos).
// Source Figma frame 109:5515.
import { frame, pageHeader } from "../frame.js";
import { textCardGrid } from "../blocks.js";

const ex = (n) => Array.from({ length: n }, () => ({
  title: "Title",
  body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
}));

export default {
  name: "core/cards-row-4",
  slide: 37,
  figmaNode: "109:5515",
  family: "core", role: "cards", shape: "row", count: 4, theme: "light", chrome: false,
  use: "A header, then four text cards in a row — each a title with a short paragraph. No imagery.",
  media: [],
  capacity: { items: 4, min: 3, max: 4 },
  slots: { images: 0, titles: 4, body: 4, stats: 0, icons: 0 },
  description: "core/cards-row-4 — header + four text cards in a row.",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    cards: "array of 4 {title, body}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    cards: ex(4),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "135" },
  },
  render(s) {
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      `<div class="v2f-rowc">${textCardGrid((s.cards || []).slice(0, 4), 4)}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
