// Template: core/gallery-split-3-photo — a heading column with a photo below it, then two photo + text
// cards that bleed off the top and bottom of the slide. No footer.
// Source Figma frame 109:5140.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { vCard, SAMPLE } from "../blocks.js";

const ph = (src, style = "") => `<div class="ph"${style ? ` style="${style}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/gallery-split-3-photo",
  slide: 52,
  figmaNode: "109:5140",
  family: "core", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "A heading with a large photo below it, beside two staggered photo + text cards that run off the slide edges.",
  media: ["photo"],
  capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 3, subtitles: 2, body: 2, stats: 0, icons: 0 },
  description: "core/gallery-split-3-photo — heading + photo column, two bleeding photo/text cards.",
  schema: {
    caption: "string", title: "string", subtitle: "string",
    images: "array of 3 photo paths — under the heading, then one per card",
    cards: "array of 2 {title, subtitle, body} — the first photo-first, the second text-first",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", subtitle: "Subtitle",
    images: SAMPLE.slice(0, 3),
    cards: [{ title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." }, { title: "Title", subtitle: "Subtitle", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "122" },
  },
  render(s) {
    const im = s.images || []; const c = s.cards || [];
    return `
      <div class="v2f-root v2f-bleed">
        <div class="v2f-bleed-layer reveal">
          <div style="left:40px;top:40px;width:908px;display:flex;flex-direction:column;gap:32px;">
            ${topBar(s.meta)}
            <div class="v2f-heading" style="width:auto;gap:0;">
              ${s.caption ? `<p class="v2f-caption">${esc(s.caption)}</p>` : ""}
              ${s.title ? `<p class="v2f-title">${esc(s.title)}</p>` : ""}
              ${s.subtitle ? `<p class="v2f-subtitle" style="font-size:36px;line-height:44px;">${esc(s.subtitle)}</p>` : ""}
            </div>
          </div>
          <div class="v2f-bleed-img" style="left:40px;top:368px;width:908px;height:672px;">${im[0] ? `<img src="${esc(im[0])}" alt="">` : ""}</div>
          <div style="left:972px;top:-192px;width:442px;">${vCard({ ...c[0], image: im[1] })}</div>
          <div style="left:1438px;top:112px;width:442px;">${vCard({ ...c[1], image: im[2] }, { textFirst: true })}</div>
        </div>
      </div>`;
  },
};
