// Template: creative/grid-04 — a mood board: text column left, a photo masonry right
// (a big feature column split into nested clusters, plus a trailing column). Source
// Figma frame 7:1582.
import { topBar, footerBar } from "../frame.js";
import { moodBoard } from "../creative-blocks.js";

export default {
  name: "creative/grid-04", slide: 186, figmaNode: "7:1582",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A mood board — art-direction text left, a photo masonry right with a nested feature column and a trailing column.",
  media: ["photo"], capacity: { items: 11, min: 11, max: 11 },
  slots: { images: 11, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "creative/grid-04 — mood board: text left, nested masonry + trailing column right.",
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
      { f: 908, dir: "column", items: [
        { f: 454, dir: "row", items: [
          { f: 442, i: 0 },
          { f: 442, dir: "column", items: [{ f: 215, dir: "row", items: [{ i: 1 }, { i: 2 }] }, { f: 215, i: 3 }] },
        ] },
        { f: 454, dir: "row", items: [
          { f: 675, i: 4 },
          { f: 209, dir: "column", items: [{ f: 147, i: 5 }, { f: 283, i: 6 }] },
        ] },
      ] },
      { f: 442, dir: "column", items: [
        { f: 317, i: 7 }, { f: 363, i: 8 }, { f: 204, dir: "row", items: [{ i: 9 }, { i: 10 }] },
      ] },
    ] };
    return moodBoard(s, tree, { topBar, footerBar });
  },
};
