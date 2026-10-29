// Template: creative/grid-03 — a mood board: text column left, a deep masonry on the
// right (a large feature block subdivided into nested rows/columns, plus a trailing
// column). Source Figma frame 7:1313.
import { topBar, footerBar } from "../frame.js";
import { moodBoard } from "../creative-blocks.js";

export default {
  name: "creative/grid-03", slide: 183, figmaNode: "7:1313",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A mood board — art-direction text left, a deep nested photo masonry right.",
  media: ["photo"], capacity: { items: 12, min: 12, max: 12 },
  slots: { images: 12, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "creative/grid-03 — mood board: text left, deep nested photo masonry right.",
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
      // large feature column (weight 908)
      { f: 908, dir: "column", items: [
        { f: 591, dir: "row", items: [
          { f: 442, i: 0 },
          { f: 442, dir: "column", items: [
            { f: 283, i: 1 },
            { f: 283, dir: "row", items: [
              { f: 209, dir: "column", items: [{ i: 2 }, { i: 3 }] },
              { f: 209, i: 4 },
            ] },
          ] },
        ] },
        { f: 317, dir: "row", items: [{ f: 325, i: 5 }, { f: 325, i: 6 }, { f: 209, i: 7 }] },
      ] },
      // trailing column (weight 442)
      { f: 442, dir: "column", items: [
        { f: 317, i: 8 },
        { f: 363, i: 9 },
        { f: 204, dir: "row", items: [{ i: 10 }, { i: 11 }] },
      ] },
    ] };
    return moodBoard(s, tree, { topBar, footerBar });
  },
};
