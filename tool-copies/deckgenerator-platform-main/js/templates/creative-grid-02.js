// Template: creative/grid-02 — a mood board: text column left, a richer masonry of three
// photo columns right, two of them splitting a slot into a paired row. Source Figma
// frame 3:896.
import { topBar, footerBar } from "../frame.js";
import { moodBoard } from "../creative-blocks.js";

export default {
  name: "creative/grid-02", slide: 182, figmaNode: "3:896",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A mood board — art-direction text left, a three-column photo masonry right with paired sub-cells.",
  media: ["photo"], capacity: { items: 10, min: 10, max: 10 },
  slots: { images: 10, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "creative/grid-02 — mood board: text left, three-column masonry with paired cells right.",
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
      { dir: "column", items: [{ f: 591, i: 0 }, { f: 317, i: 1 }] },
      { dir: "column", items: [
        { f: 317, i: 2 },
        { f: 204, dir: "row", items: [{ i: 3 }, { i: 4 }] },
        { f: 363, i: 5 },
      ] },
      { dir: "column", items: [
        { f: 317, i: 6 },
        { f: 363, i: 7 },
        { f: 204, dir: "row", items: [{ i: 8 }, { i: 9 }] },
      ] },
    ] };
    return moodBoard(s, tree, { topBar, footerBar });
  },
};
