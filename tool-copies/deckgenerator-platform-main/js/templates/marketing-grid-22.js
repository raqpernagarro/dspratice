// Template: marketing/grid-22 — an eyebrow, title and subtitle, then three tinted cards each with a title and sentence at the top and, at the bottom, one or more product categories — a label with its chips — each category on its own line.
// Source Figma frame 110:30976.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-22", slide: 341, figmaNode: "110:30976",
  family: "marketing", role: "cards", shape: "row", theme: "light", chrome: false,
  use: "Three deliverable cards, each listing product categories as chips on separate lines",
  media: [], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 0, titles: 7, subtitles: 1, body: 3, stats: 0, icons: 0 },
  description: "marketing/grid-22 — an eyebrow, title and subtitle, then three tinted cards each with a title and sentence at the top and, at the bottom, one or more product categories — a label with its chips — each category on its own line.",
  intent: {
    bestFor: ["mapping deliverables (campaign, social assets, product pages) to the product categories each one covers"],
    holds: "an eyebrow, a title, a subtitle, and three cards with a title of up to about 22 characters, a sentence of up to about 90 characters and two or three categories with a label and up to three chips each",
    itemChars: 90,
    avoid: ["more than three cards", "more than three categories per card", "chip labels longer than 14 characters"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", cards: "array of 3 {title, body, groups: [{label, chips: string[]}] (1–3)} — every group sits on its own line",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Deliverables", title: "Deliverable", subtitle: "Overview",
    cards: [
      { title: "Hero Campaign", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.", groups: [{ label: "Product category 1", chips: ["Lorem"] }, { label: "Product category 2", chips: ["Lorem", "Lorem", "Lorem"] }] },
      { title: "Social Assets", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.", groups: [{ label: "Product category 1", chips: ["Lorem"] }, { label: "Product category 2", chips: ["Lorem", "Lorem", "Lorem"] }, { label: "Product category 3", chips: ["Lorem", "Lorem", "Lorem"] }] },
      { title: "Product Discovery", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.", groups: [{ label: "Product category 1", chips: ["Lorem", "Lorem"] }, { label: "Product category 2", chips: ["Lorem", "Lorem", "Lorem"] }] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "34" },
    footer: MK_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h152 reveal"><div class="v2f-mk-ph center"><div class="hd">
          ${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<div><p class="v2f-cs-h2">${esc(s.title ?? "")}</p>${s.subtitle ? `<p class="v2f-cs-h4 v2f-cs-muted">${esc(s.subtitle)}</p>` : ""}</div></div></div></div>
        <div class="v2f-mk-3dc reveal">${(s.cards || []).slice(0, 3).map((c) => `
          <div class="cd"><div class="tx"><p class="h">${esc(c.title ?? "")}</p><p class="b">${esc(c.body ?? "")}</p></div>${mkChipGroups((c.groups || []).slice(0, 3).map((g) => ({ ...g, tone: "dark" })), "dark")}</div>`).join("")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
