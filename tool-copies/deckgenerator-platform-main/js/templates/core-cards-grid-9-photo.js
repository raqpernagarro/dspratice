// Template: core/cards-grid-9-photo — a 3×3 grid of nine cards, each a photo on
// the left and a title, subtitle and short text on the right. No page header.
// Source Figma frame 109:5277 (cards are the TextBlockWithImage/Core component).
// It used to render a header over nine bare photos, which is not the frame.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { SAMPLE } from "../blocks.js";

const card = (c = {}) => `
  <div class="v2f-c9-card">
    <div class="ph">${c.image ? `<img src="${esc(c.image)}" alt="">` : ""}</div>
    <div class="tx">
      <div>
        ${c.title ? `<p class="t">${esc(c.title)}</p>` : ""}
        ${c.subtitle ? `<p class="s">${esc(c.subtitle)}</p>` : ""}
      </div>
      ${c.body ? `<p class="b">${esc(c.body)}</p>` : ""}
    </div>
  </div>`;

export default {
  name: "core/cards-grid-9-photo",
  slide: 28,
  figmaNode: "109:5277",
  family: "core", role: "cards", shape: "grid", count: 9, theme: "light", chrome: false,
  use: "Nine cards in a 3×3 grid, each a photo beside a title, subtitle and one or two lines of text.",
  media: ["photo"],
  capacity: { items: 9, min: 7, max: 9 },
  slots: { images: 9, titles: 9, subtitles: 9, body: 9, stats: 0, icons: 0 },
  description: "core/cards-grid-9-photo — 3×3 cards: photo left, title + subtitle + short text right.",
  intent: {
    bestFor: ["nine people, offices, products or services, each with a picture and a line about it"],
    holds: "7–9 items of a title (about 20 characters), a subtitle and a text of up to about 120 characters, each with a photo",
    itemChars: 130,
    avoid: ["fewer than seven items", "items without a picture", "content that needs a slide heading"],
    feel: "dense",
    needs: ["a photo per item"],
  },
  schema: {
    cards: "array of 7–9 { image, title, subtitle, body }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    cards: SAMPLE.slice(0, 9).map((image) => ({
      image, title: "Title", subtitle: "Subtitle",
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "98" },
  },
  render(s) {
    // Saved slides from the old render carry `images` (and a page header) only.
    const cards = s.cards || (s.images || []).map((image) => ({ image }));
    return frame(`<div class="v2f-c9 reveal">${cards.slice(0, 9).map(card).join("")}</div>`, { meta: s.meta, footer: s.footer });
  },
};
