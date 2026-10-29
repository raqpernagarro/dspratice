// Template: marketing/grid-20 — an eyebrow and 60px title over three tinted cards, each with a topic, a paragraph, a '>' list and a photo filling the bottom.
// Source Figma frame 110:30919.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-20", slide: 337, figmaNode: "110:30919",
  family: "marketing", role: "cards", shape: "row", theme: "light", chrome: false,
  use: "Three tinted cards, each with a topic, a paragraph, a short list and a photo",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 4, subtitles: 0, body: 3, stats: 0, icons: 0 },
  description: "marketing/grid-20 — an eyebrow and 60px title over three tinted cards, each with a topic, a paragraph, a '>' list and a photo filling the bottom.",
  intent: {
    bestFor: ["three content pillars with their key points and an example visual each"],
    holds: "an eyebrow, a title, and three cards with a topic, a paragraph of up to about 420 characters, up to three short list items and a photo",
    itemChars: 420,
    avoid: ["more or fewer than three cards", "no photos"],
    feel: "dense",
    needs: ["3 photos"],
  },
  schema: {
    caption: "string", title: "string", cards: "array of 3 {title, body, points: string[], image}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Content strategy", title: "Content pillars",
    cards: [1, 2, 3].map((n) => ({ title: `Topic ${n}`, body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam at egestas lectus. Sed bibendum placerat nibh. Pellentesque interdum massa eu mi congue tincidunt. Nunc pretium dui nulla, vel tincidunt ligula gravida sed. Integer hendrerit ex a vestibulum pretium. Donec quis lorem aliquet, convallis libero eu, luctus metus. In hac habitasse platea dictumst. Nulla molestie massa sem, non convallis nibh congue eget.", points: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"], image: mkPhoto(n) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "30" },
    footer: MK_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h108 reveal">${mkPageHead({ caption: s.caption, title: s.title })}</div>
        <div class="v2f-mk-3cards reveal">${(s.cards || []).slice(0, 3).map((c) => `
          <div class="cd"><div class="tx"><p class="h">${esc(c.title ?? "")}</p><p class="b">${esc(c.body ?? "")}</p>${(c.points || []).length ? `<p class="pl">${(c.points || []).slice(0, 3).map((p) => "&gt; " + esc(p)).join("<br>")}</p>` : ""}</div>${mkImg(c.image)}</div>`).join("")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
