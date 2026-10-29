// Template: marketing/text-19 — a small header over a 4×2 grid of tinted cards, each with an image, a name and a three-line description.
// Source Figma frame 110:31651.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-19", slide: 357, figmaNode: "110:31651",
  family: "marketing", role: "cards", shape: "grid", theme: "light", chrome: false,
  use: "Eight campaign cards in two rows: image, name and a three-line description",
  media: ["photo"], capacity: { items: 8, min: 4, max: 8 },
  slots: { images: 8, titles: 9, subtitles: 1, body: 8, stats: 0, icons: 0 },
  description: "marketing/text-19 — a small header over a 4×2 grid of tinted cards, each with an image, a name and a three-line description.",
  intent: {
    bestFor: ["a summary of the campaign: its channels, assets or workstreams at a glance, each with a picture"],
    holds: "a title and subtitle and four to eight cards with an image, a name of up to about 18 characters and a description of up to about 110 characters",
    itemChars: 110,
    avoid: ["more than eight cards", "no images"],
    feel: "visual",
    needs: ["images"],
  },
  schema: {
    title: "string", subtitle: "string", cards: "array of 4–8 {title, body, image}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Summary", subtitle: "Campaign",
    cards: ["Campaign", "Organic social", "Paid social", "Press", "CRM", ".com", "Offline", "Conversation"].map((title, i) => ({ title, body: "Lorem ipsum dolor sit amet, consectetur\nadipiscing elit, sed do eiusmod tempor\nincididunt ut labore et dolore magna.", image: mkPhoto(i) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "50" },
    footer: MK_FOOTER,
  },
  render(s) {
    const c = (s.cards || []).slice(0, 8);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkSmallHead({ title: s.title, subtitle: s.subtitle }, { mid: true, md: true })}
        <div class="v2f-mk-8c reveal">${c.map((x) => `<div class="cd">${mkImg(x.image)}<p class="h">${esc(x.title ?? "")}</p><p class="b">${esc(x.body ?? "")}</p></div>`).join("")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
