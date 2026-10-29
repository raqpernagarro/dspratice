// Template: brand-guidelines/grid-02 — a caption, title, subtitle and paragraph in a narrow left column; at the right three to five colour tiles stacked on a tinted panel, each with name, RGB and HEX.
// Source Figma frame 109:14736.
// Also covers brand-guidelines/grid-06 and grid-07 (four and five colours) (same layout, another state).
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-02", slide: 399, figmaNode: "109:14736",
  family: "brand-guidelines", role: "chart", shape: "split", theme: "light", chrome: false,
  use: "Palette as stacked colour tiles",
  media: [], capacity: { items: 3, min: 3, max: 5 },
  slots: { images: 0, titles: 6, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-02 — a caption, title, subtitle and paragraph in a narrow left column; at the right three to five colour tiles stacked on a tinted panel, each with name, RGB and HEX.",
  intent: {
    bestFor: ["a primary or secondary palette with its values"],
    holds: "a caption, a title, a subtitle, a paragraph and three to five colours with name, RGB and HEX",
    itemChars: 250,
    avoid: ["more than five colours (use grid-09)"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", colors: "array of 3–5 {name, rgb, hex, color?, ink?}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Palette", subtitle: "Primary", body: BR_LOREM, colors: BR_PRIMARY, caption: "Colours",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "23" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), brPanel((s.colors || []).slice(0, 5).map((c) => brSwatch(c, { cls: "dim grow" })).join(""), { cls: "pad col", style: `gap:${(s.colors || []).length > 3 ? 8 : 24}px;` }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
