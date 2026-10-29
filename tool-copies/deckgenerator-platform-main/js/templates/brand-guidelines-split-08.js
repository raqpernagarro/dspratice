// Template: brand-guidelines/split-08 — a caption and title over a 2×2 grid of grey cards; the active cards show a heading bar and text, the rest are dimmed placeholders for what follows.
// Source Figma frame 109:15293.
// Also covers brand-guidelines/split-09 (two active) (same layout, another state).
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/split-08", slide: 421, figmaNode: "109:15293",
  family: "brand-guidelines", role: "cards", shape: "grid", theme: "light", chrome: false,
  use: "How we write: principles revealed one at a time",
  media: [], capacity: { items: 4, min: 1, max: 4 },
  slots: { images: 0, titles: 5, subtitles: 0, body: 4, stats: 0, icons: 0 },
  description: "brand-guidelines/split-08 — a caption and title over a 2×2 grid of grey cards; the active cards show a heading bar and text, the rest are dimmed placeholders for what follows.",
  intent: {
    bestFor: ["writing principles or rules revealed one by one across slides"],
    holds: "a caption, a title and up to four cards, each a heading and a line of up to about 140 characters; `active` sets how many are shown",
    itemChars: 140,
    avoid: ["more than four principles"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", cards: "array of up to 4 {title, text}", active: "number — how many cards are shown in full, from the first (default 1)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "How we write", active: 1,
    cards: Array.from({ length: 4 }, () => ({ title: "Title", text: BR_SHORT })), caption: "Tone of voice",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "45" },
    footer: BR_FOOTER,
  },
  render(s) {
    const n = Math.max(0, Number(s.active ?? 1));
    const cards = Array.from({ length: 4 }, (_, i) => (s.cards || [])[i] || {});
    const card = (c, i) => i < n ? `<div class="v2f-br-wcard"><p class="bar">${esc(c.title ?? "")}</p><p class="tx">${esc(c.text ?? "")}</p></div>` : '<div class="v2f-br-wcard off"></div>';
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${brHead({ caption: s.caption, title: s.title }, { big: true })}</div>
        <div class="v2f-br-wgrid reveal"><div class="row">${card(cards[0], 0)}${card(cards[1], 1)}</div><div class="row">${card(cards[2], 2)}${card(cards[3], 3)}</div></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
