// Template: creative/text-04 — a mood board: text column left, a two-column photo
// masonry right with nested paired cells. Source Figma frame 7:1392.
import { topBar, footerBar } from "../frame.js";
import { moodBoard } from "../creative-blocks.js";

export default {
  name: "creative/text-04", slide: 184, figmaNode: "7:1392",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A mood board — art-direction text left, a two-column photo masonry right with nested paired cells.",
  media: ["photo"], capacity: { items: 12, min: 12, max: 12 },
  slots: { images: 12, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "creative/text-04 — mood board: text left, two-column nested masonry right.",
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
      { f: 675, dir: "column", items: [
        { f: 591, dir: "row", items: [
          { f: 442, i: 0 },
          { f: 209, dir: "column", items: [{ f: 283, i: 1 }, { f: 130, i: 2 }, { f: 130, i: 3 }] },
        ] },
        { f: 317, dir: "row", items: [{ i: 4 }, { i: 5 }] },
      ] },
      { f: 675, dir: "column", items: [
        { f: 454, i: 6 },
        { f: 454, dir: "row", items: [
          { f: 209, dir: "column", items: [{ f: 147, i: 7 }, { f: 283, i: 8 }] },
          { f: 442, dir: "column", items: [{ f: 226, i: 9 }, { f: 204, dir: "row", items: [{ i: 10 }, { i: 11 }] }] },
        ] },
      ] },
    ] };
    return moodBoard(s, tree, { topBar, footerBar });
  },
};
