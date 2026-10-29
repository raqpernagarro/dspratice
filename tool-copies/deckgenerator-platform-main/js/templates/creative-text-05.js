// Template: creative/text-05 — a mood board: text column left, a two-column photo
// masonry right (a big cell + a stacked pair, a full cell, and a nested cluster).
// Source Figma frame 7:1536.
import { topBar, footerBar } from "../frame.js";
import { moodBoard } from "../creative-blocks.js";

export default {
  name: "creative/text-05", slide: 185, figmaNode: "7:1536",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A mood board — art-direction text left, a two-column photo masonry right.",
  media: ["photo"], capacity: { items: 10, min: 10, max: 10 },
  slots: { images: 10, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "creative/text-05 — mood board: text left, two-column masonry right.",
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
        { f: 454, dir: "row", items: [
          { f: 442, i: 0 },
          { f: 209, dir: "column", items: [{ f: 283, i: 1 }, { f: 147, i: 2 }] },
        ] },
        { f: 454, i: 3 },
      ] },
      { f: 675, dir: "column", items: [
        { f: 454, i: 4 },
        { f: 454, dir: "row", items: [
          { f: 209, dir: "column", items: [{ f: 147, i: 5 }, { f: 283, i: 6 }] },
          { f: 442, dir: "column", items: [{ f: 226, i: 7 }, { f: 204, dir: "row", items: [{ i: 8 }, { i: 9 }] }] },
        ] },
      ] },
    ] };
    return moodBoard(s, tree, { topBar, footerBar });
  },
};
