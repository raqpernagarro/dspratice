// Template: core/cards-row-5 — header + five text cards in a row (no photos).
// Source Figma frame 632:27683.
import { frame, pageHeader } from "../frame.js";
import { textCardGrid } from "../blocks.js";

const ex = (n) => Array.from({ length: n }, () => ({
  title: "Title",
  body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
}));

export default {
  name: "core/cards-row-5",
  slide: 38,
  figmaNode: "632:27683",
  family: "core", role: "cards", shape: "row", count: 5, theme: "light", chrome: false,
  use: "A header, then five text cards in a row — each a title with a short paragraph. No imagery.",
  media: [],
  capacity: { items: 5, min: 4, max: 5 },
  slots: { images: 0, titles: 5, body: 5, stats: 0, icons: 0 },
  description: "core/cards-row-5 — header + five text cards in a row.",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    cards: "array of 5 {title, body}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    cards: ex(5),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "136" },
  },
  render(s) {
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      `<div class="v2f-rowc">${textCardGrid((s.cards || []).slice(0, 5), 5)}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
