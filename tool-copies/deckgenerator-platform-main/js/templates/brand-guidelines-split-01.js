// Template: brand-guidelines/split-01 — a small caption over a large statement in the left half of the slide.
// Source Figma frame 109:14505.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/split-01", slide: 381, figmaNode: "109:14505",
  family: "brand-guidelines", role: "statement", shape: "single", theme: "light", chrome: false,
  use: "Foreword or statement in large type",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/split-01 — a small caption over a large statement in the left half of the slide.",
  intent: {
    bestFor: ["a foreword, manifesto line or opening statement"],
    holds: "a caption and a statement of up to about 240 characters",
    itemChars: 240,
    avoid: ["long text", "lists"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", body: "string — the statement",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.", caption: "Foreword",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "05" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-fw reveal"><p class="c">${esc(s.caption ?? "")}</p><p class="b">${esc(s.body ?? "")}</p></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
