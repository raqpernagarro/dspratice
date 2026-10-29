// Template: creative/grid-01 — a mood board: text column left, three photo columns
// right (3 / 2 / 3 cells) for a masonry rhythm. Source Figma frame 3:871.
import { topBar, footerBar } from "../frame.js";
import { moodBoard } from "../creative-blocks.js";

export default {
  name: "creative/grid-01", slide: 181, figmaNode: "3:871",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A mood board — art-direction text left, three photo columns right (3 / 2 / 3 cells).",
  media: ["photo"], capacity: { items: 8, min: 8, max: 8 },
  slots: { images: 8, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "creative/grid-01 — mood board: text left, 3/2/3 masonry photo columns right.",
  schema: {
    caption: "string — eyebrow", title: "string — heading", subtitle: "string — muted 2nd line",
    body: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Art Direction", title: "Photography", subtitle: "Mood",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ i: 0 }, { i: 1 }, { i: 2 }] },
      { dir: "column", items: [{ i: 3 }, { i: 4 }] },
      { dir: "column", items: [{ i: 5 }, { i: 6 }, { i: 7 }] },
    ] };
    return moodBoard(s, tree, { topBar, footerBar });
  },
};
