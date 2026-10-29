// Template: brand-guidelines/grid-23 — a caption and title over a tinted card with two word lists meeting in the middle: what the voice is (tick, right-aligned) and what it is not (cross, muted).
// Source Figma frame 109:15349.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-23", slide: 423, figmaNode: "109:15349",
  family: "brand-guidelines", role: "detail", shape: "cols", theme: "light", chrome: false,
  use: "Do's and don'ts as paired words",
  media: [], capacity: { items: 9, min: 3, max: 9 },
  slots: { images: 0, titles: 19, subtitles: 0, body: 0, stats: 0, icons: 2 },
  description: "brand-guidelines/grid-23 — a caption and title over a tinted card with two word lists meeting in the middle: what the voice is (tick, right-aligned) and what it is not (cross, muted).",
  intent: {
    bestFor: ["tone-of-voice traits against the traits to avoid"],
    holds: "a caption, a title and three to nine pairs of single words",
    itemChars: 14,
    avoid: ["sentences (use grid-24)"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", dos: "array of up to 9 words", donts: "array of up to 9 words — paired with dos by position",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Tone of voice", title: "Do’s and Don’ts",
    dos: ["Curious", "Generous", "Clear", "Confident", "Optimistic", "Honest", "Playful", "Revealing", "Refined"],
    donts: ["Assuming", "Self-centred", "Complicated", "Arrogant", "Naive", "Blunt", "Silly", "Exposing", "Cold"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "47" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${brHead({ caption: s.caption, title: s.title }, { big: true })}</div>
        <div class="v2f-br-words reveal"><div class="do">${brMark(true)}${(s.dos || []).slice(0, 9).map((w) => `<p>${esc(w)}</p>`).join("")}</div><div class="dont">${brMark(false)}${(s.donts || []).slice(0, 9).map((w) => `<p>${esc(w)}</p>`).join("")}</div></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
