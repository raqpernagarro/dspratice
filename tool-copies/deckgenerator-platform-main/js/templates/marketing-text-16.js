// Template: marketing/text-16 — an eyebrow, title and subtitle, then a wide icon card for the big idea and four tinted concept cards below, each with an icon, an eyebrow, a title and a sentence.
// Source Figma frame 110:30966.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-16", slide: 340, figmaNode: "110:30966",
  family: "marketing", role: "cards", shape: "grid", theme: "light", chrome: false,
  use: "One wide idea card above four concept cards",
  media: [], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 0, titles: 7, subtitles: 1, body: 5, stats: 0, icons: 5 },
  description: "marketing/text-16 — an eyebrow, title and subtitle, then a wide icon card for the big idea and four tinted concept cards below, each with an icon, an eyebrow, a title and a sentence.",
  intent: {
    bestFor: ["presenting one big idea and the four concepts that bring it to life"],
    holds: "an eyebrow, a title, a subtitle, one wide card (title and up to about 240 characters) and four cards with an eyebrow, a title of up to about 22 characters and a sentence of up to about 130 characters",
    itemChars: 130,
    avoid: ["more or fewer than four concepts", "long titles"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", idea: "{icon, title, body}", cards: "array of 4 {icon, caption, title, body}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Deliverables", title: "Deliverable", subtitle: "Overview",
    idea: { title: "1 x Big idea", body: MK_LOREM },
    cards: [["Concept 1", "Hero Campaign"], ["Concept 2", "Social Narrative"], ["Concept 3", "PR Activations"], ["Concept 4", "Product Cutdowns"]].map(([caption, title]) => ({ caption, title, body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "33" },
    footer: MK_FOOTER,
  },
  render(s) {
    const i = s.idea || {};
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h152 reveal"><div class="v2f-mk-ph center"><div class="hd">
          ${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<div><p class="v2f-cs-h2">${esc(s.title ?? "")}</p>${s.subtitle ? `<p class="v2f-cs-h4 v2f-cs-muted">${esc(s.subtitle)}</p>` : ""}</div></div></div></div>
        <div class="v2f-mk-idea reveal">
          <div class="wide">${mkIcon(i.icon || "person-checkmark")}<p class="t">${esc(i.title ?? "")}</p><p class="b">${esc(i.body ?? "")}</p></div>
          <div class="row">${(s.cards || []).slice(0, 4).map((c) => `<div class="cd">${mkIcon(c.icon || "person-checkmark")}<div class="ct"><p class="cap">${esc(c.caption ?? "")}</p><p class="v2f-cs-h4">${esc(c.title ?? "")}</p></div><p class="b">${esc(c.body ?? "")}</p></div>`).join("")}</div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
