// Template: creative/text-01 — a mood board: left text column (Art Direction /
// Photography / Mood + body) and a 2×2 photo grid on the right with alternating
// big/small cells. Source Figma frame 3:785 (section "Creative", 14:1201).
import { topBar, footerBar } from "../frame.js";
import { moodBoard } from "../creative-blocks.js";

export default {
  name: "creative/text-01", slide: 178, figmaNode: "3:785",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A mood board — art-direction text column on the left, a 2×2 photo grid with alternating big/small cells on the right.",
  media: ["photo"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "creative/text-01 — mood board: text left, 2×2 alternating photo grid right.",
  schema: {
    caption: "string — eyebrow", title: "string — heading", subtitle: "string — muted 2nd line",
    body: "array of paragraph strings", images: "array of 4 photo srcs",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Art Direction", title: "Photography", subtitle: "Mood",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const tree = { dir: "column", items: [
      { dir: "row", items: [{ f: 908, i: 0 }, { f: 442, i: 1 }] },
      { dir: "row", items: [{ f: 442, i: 2 }, { f: 908, i: 3 }] },
    ] };
    return moodBoard(s, tree, { topBar, footerBar });
  },
};
