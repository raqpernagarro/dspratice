// Template: marketing/grid-23 — an eyebrow, title and subtitle, then three full-width tinted cards, each with an icon, a 36px label and a short description.
// Source Figma frame 110:31035.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-23", slide: 342, figmaNode: "110:31035",
  family: "marketing", role: "cards", shape: "list", theme: "light", chrome: false,
  use: "Three wide cards stacked: an icon, a label and a two-line description",
  media: [], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 0, titles: 5, subtitles: 1, body: 3, stats: 0, icons: 3 },
  description: "marketing/grid-23 — an eyebrow, title and subtitle, then three full-width tinted cards, each with an icon, a 36px label and a short description.",
  intent: {
    bestFor: ["a messaging framework: purpose, mission, positioning", "three principles that each need two or three lines"],
    holds: "an eyebrow, a title, a subtitle and three cards with a label of up to about 20 characters and a description of up to about 220 characters",
    itemChars: 220,
    avoid: ["more or fewer than three cards", "long labels"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", cards: "array of 3 {icon, title, body}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Messaging", title: "Messaging", subtitle: "Framework",
    cards: ["Purpose", "Mission", "Positioning"].map((title) => ({ title, body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed\ndo eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,\nquis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "35" },
    footer: MK_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h144 reveal"><div class="v2f-mk-ph center"><div class="hd">
          ${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<div><p class="v2f-cs-h2">${esc(s.title ?? "")}</p>${s.subtitle ? `<p class="v2f-cs-h5 v2f-cs-muted">${esc(s.subtitle)}</p>` : ""}</div></div></div></div>
        <div class="v2f-mk-wide3 reveal">${(s.cards || []).slice(0, 3).map((c) => mkCard(`${mkIcon(c.icon || "person-checkmark")}<p class="v2f-cs-h4 v2f-mk-ct">${esc(c.title ?? "")}</p><p class="v2f-mk-cb wide">${esc(c.body ?? "")}</p>`, { cls: "v2f-mk-row center" })).join("")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
