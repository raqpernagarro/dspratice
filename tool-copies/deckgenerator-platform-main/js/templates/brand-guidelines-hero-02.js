// Template: brand-guidelines/hero-02 — a large statement in white on a grey card that fills the slide body, with a small caption.
// Source Figma frame 109:14510.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/hero-02", slide: 382, figmaNode: "109:14510",
  family: "brand-guidelines", role: "statement", shape: "single", theme: "light", chrome: false,
  use: "Statement on a full grey card",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/hero-02 — a large statement in white on a grey card that fills the slide body, with a small caption.",
  intent: {
    bestFor: ["a foreword or key statement given extra weight"],
    holds: "a caption and a statement of up to about 240 characters",
    itemChars: 240,
    avoid: ["long text"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", body: "string — the statement",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.", caption: "Foreword",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "06" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-card reveal"><div class="v2f-br-fw on"><p class="c">${esc(s.caption ?? "")}</p><p class="b">${esc(s.body ?? "")}</p></div></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
