// Template: creative/text-02 — a mood board: text column left, a photo grid right with
// a big+small top row and three equal cells beneath. Source Figma frame 3:835.
import { topBar, footerBar } from "../frame.js";
import { moodBoard } from "../creative-blocks.js";

export default {
  name: "creative/text-02", slide: 179, figmaNode: "3:835",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A mood board — art-direction text left, a photo grid right (big+small top row, three equal cells below).",
  media: ["photo"], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 5, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "creative/text-02 — mood board: text left, big+small over three equal photos right.",
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
      { dir: "row", items: [{ f: 908, i: 0 }, { f: 442, i: 1 }] },
      { dir: "row", items: [{ i: 2 }, { i: 3 }, { i: 4 }] },
    ] };
    return moodBoard(s, tree, { topBar, footerBar });
  },
};
