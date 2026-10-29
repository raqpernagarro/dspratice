// Template: creative/text-03 — a mood board: text column left, an even 3×2 photo grid
// (six equal cells) on the right. Source Figma frame 3:851.
import { topBar, footerBar } from "../frame.js";
import { moodBoard } from "../creative-blocks.js";

export default {
  name: "creative/text-03", slide: 180, figmaNode: "3:851",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A mood board — art-direction text left, an even 3×2 grid of six equal photos right.",
  media: ["photo"], capacity: { items: 6, min: 6, max: 6 },
  slots: { images: 6, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "creative/text-03 — mood board: text left, even 3×2 photo grid right.",
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
    const tree = { dir: "column", items: [
      { dir: "row", items: [{ i: 0 }, { i: 1 }, { i: 2 }] },
      { dir: "row", items: [{ i: 3 }, { i: 4 }, { i: 5 }] },
    ] };
    return moodBoard(s, tree, { topBar, footerBar });
  },
};
