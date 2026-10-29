// Template: core/cards-mosaic-5-photo — header + a 2×3 grid of photo cards with
// a caption and number badge overlaid on each image. Source Figma frame 109:5035.
import { frame } from "../frame.js";
import { overlayGrid, SAMPLE } from "../blocks.js";
import { esc } from "../components.js";

export default {
  name: "core/cards-mosaic-5-photo",
  slide: 29,
  figmaNode: "109:5035",
  family: "core", role: "cards", shape: "mosaic", count: 6, theme: "light", chrome: false,
  use: "A header, then a grid of photos each with a short caption and a number badge overlaid — a ranked or numbered set.",
  media: ["photo"],
  capacity: { items: 6, min: 4, max: 6 },
  slots: { images: 6, titles: 1, subtitles: 1, body: 6, stats: 0, icons: 0 },
  description: "core/cards-mosaic-5-photo — header + overlay photo cards (caption + number badge) in a grid.",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string — up to two paragraphs, separated by a blank line",
    cards: "array of up to 6 {image, label, number}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", subtitle: "Subtitle",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    cards: SAMPLE.slice(0, 6).map((image, i) => ({ image, label: "Lorem ipsum dolor sit amet.", number: i + 1 })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "92" },
  },
  render(s) {
    // Figma 109:5035: a 700px heading beside two paragraph columns, then the
    // 3×2 overlay cards.
    const paras = Array.isArray(s.intro) ? s.intro : String(s.intro ?? "").split(/\n\s*\n/);
    const head = `
      <div class="v2f-cm5-head reveal">
        <div class="v2f-heading">
          ${s.caption ? `<p class="v2f-caption">${esc(s.caption)}</p>` : ""}
          ${s.title ? `<p class="v2f-title">${esc(s.title)}</p>` : ""}
          ${s.subtitle ? `<p class="v2f-subtitle">${esc(s.subtitle)}</p>` : ""}
        </div>
        <div class="paras">${paras.filter((p) => p && p.trim()).slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      </div>`;
    return frame(head + overlayGrid((s.cards || []).slice(0, 6), 3), { meta: s.meta, footer: s.footer });
  },
};
