// Template: core/cards-grid-6 — header + a 2×3 grid of six text cards (no photos).
// Source Figma frame 109:5495.
import { frame, pageHeader } from "../frame.js";
import { textCardGrid } from "../blocks.js";

const ex = (n) => Array.from({ length: n }, () => ({
  title: "Title",
  body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
}));

export default {
  name: "core/cards-grid-6",
  slide: 36,
  figmaNode: "109:5495",
  family: "core", role: "cards", shape: "grid", count: 6, theme: "light", chrome: false,
  use: "A header, then a 2×3 grid of six text cards — each a title with a short paragraph. No imagery.",
  media: [],
  capacity: { items: 6, min: 5, max: 6 },
  slots: { images: 0, titles: 6, body: 6, stats: 0, icons: 0 },
  description: "core/cards-grid-6 — header + six text cards in a 2×3 grid.",
  schema: {
    caption: "string", title: "string", subtitle: "string",
    cards: "array of 6 {title, body}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", subtitle: "Subtitle", cards: ex(6),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "134" },
  },
  render(s) {
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      textCardGrid((s.cards || []).slice(0, 6), 3);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
