// Template: brand-guidelines/grid-08 — a caption and title in a narrow left column; at the right three rows (primary, secondary, tertiary), each a label and note beside up to three round colour swatches with their HEX.
// Source Figma frame 109:14799.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-08", slide: 401, figmaNode: "109:14799",
  family: "brand-guidelines", role: "chart", shape: "split", theme: "light", chrome: false,
  use: "Full palette as round swatches by tier",
  media: [], capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 0, titles: 4, subtitles: 0, body: 4, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-08 — a caption and title in a narrow left column; at the right three rows (primary, secondary, tertiary), each a label and note beside up to three round colour swatches with their HEX.",
  intent: {
    bestFor: ["the whole palette grouped by tier"],
    holds: "a caption, a title, a paragraph and two or three tiers, each a label, a note of up to about 120 characters and up to three colours",
    itemChars: 120,
    avoid: ["more than three colours per tier"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", tiers: "array of up to 3 {label, text, colors: array of up to 3 {hex, color?}}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Full Palette", body: BR_LOREM,
    tiers: [{ label: "Primary", text: BR_SHORT, colors: [{ hex: "#FFFFFF" }, { hex: "#1A1A1C", color: "#010716" }] }, { label: "Secondary", text: BR_SHORT, colors: [{ hex: "#8C9095", color: "#5c6069" }, { hex: "#CCCDD1" }, { hex: "#E5E6E7" }] }, { label: "Tertiary", text: BR_SHORT, colors: [{ hex: "#649F49" }, { hex: "#76AEEA" }, { hex: "#C94B38" }] }], caption: "Colours",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "25" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), brPanel((s.tiers || []).slice(0, 3).map((t) => `<div class="v2f-br-tier"><div class="tx"><p>${esc(t.label ?? "")}</p><p class="m">${esc(t.text ?? "")}</p></div><div class="dots">${(t.colors || []).slice(0, 3).map(brDot).join("")}</div></div>`).join(""), { cls: "tiers" }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
