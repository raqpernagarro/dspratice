// Template: core/cards-split-3-photo — one large photo beside two photo + text
// cards that bleed off the top and bottom of the slide. No footer. Source
// Figma frame 109:5131.
import { topBar } from "../frame.js";
import { vCard, SAMPLE } from "../blocks.js";
import { esc } from "../components.js";

export default {
  name: "core/cards-split-3-photo",
  slide: 30,
  figmaNode: "109:5131",
  family: "core", role: "cards", shape: "split", count: 3, theme: "light", chrome: false,
  use: "One large photo beside two staggered photo + text cards that run off the slide edges.",
  media: ["photo"],
  capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 2, subtitles: 1, body: 2, stats: 0, icons: 0 },
  description: "core/cards-split-3-photo — large photo + two bleeding photo/text cards.",
  schema: {
    images: "array of 3 photo paths — the large one, then one per card",
    cards: "array of 2 {title, subtitle, body} — the first photo-first, the second text-first",
    meta: "{ studio, name, page }",
  },
  example: {
    images: SAMPLE.slice(0, 3),
    cards: [
      { title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
      { title: "Title", subtitle: "Subtitle", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "103" },
  },
  render(s) {
    // Figma 109:5131 — no footer: a 908px photo, then two 442px cards that
    // bleed off the slide, one photo-first ending 152px above the bottom of
    // the list, one text-first dropped 72px.
    const im = s.images || []; const c = s.cards || [];
    return `
      <div class="v2f-root v2f-bleed">
        ${topBar(s.meta)}
        <div class="v2f-bleed-layer reveal">
          <div class="v2f-bleed-img" style="left:40px;top:156px;width:908px;height:884px;">${im[0] ? `<img src="${esc(im[0])}" alt="">` : ""}</div>
          <div style="left:972px;top:-192px;width:442px;">${vCard({ ...c[0], image: im[1] })}</div>
          <div style="left:1438px;top:228px;width:442px;">${vCard({ ...c[1], image: im[2] }, { textFirst: true })}</div>
        </div>
      </div>`;
  },
};
