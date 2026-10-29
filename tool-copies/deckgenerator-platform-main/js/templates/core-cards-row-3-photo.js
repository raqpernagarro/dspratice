// Template: core/cards-row-3-photo — three image cards in a row, light theme.
// Source Figma frame 109:5073. Uses the shared v2 frame (js/frame.js + .v2f-* CSS).
import { esc } from "../components.js";
import { frame, pageHeader } from "../frame.js";

const card = (c = {}) => `
  <article class="v2f-col">
    <div class="v2f-imgbox">${c.image ? `<img src="${esc(c.image)}" alt="">` : ""}</div>
    <div class="v2f-ctext">
      <div class="v2f-ctitle">
        <p class="v2f-ct">${esc(c.title ?? "")}</p>
        ${c.subtitle ? `<p class="v2f-cs">${esc(c.subtitle)}</p>` : ""}
      </div>
      ${c.body ? `<p class="v2f-cb">${esc(c.body)}</p>` : ""}
    </div>
  </article>`;

export default {
  name: "core/cards-row-3-photo",
  slide: 16,
  figmaNode: "109:5073",
  family: "core",
  role: "cards",
  shape: "row",
  count: 3,
  theme: "light",
  chrome: false,
  use: "Three image cards in a row — each with a photo, title, subtitle and short body. Services, values or highlights.",
  media: ["photo"],
  capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 3, titles: 3, subtitles: 3, body: 3, stats: 0, icons: 0 },
  description: "core/cards-row-3-photo — header + intro, then three photo cards in a row.",
  schema: {
    caption: "string — eyebrow above the title", title: "string — 60px title",
    subtitle: "string — 48px subtitle", intro: "string — 28px intro paragraph (right)",
    cards: "array of 3 {image, title, subtitle, body}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "95" },
    cards: [
      { image: "assets/photography/20200717-084726_Nagarro_295.jpg", title: "Title", subtitle: "Subtitle", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
      { image: "assets/photography/20200717-085451_Nagarro_4227.jpg", title: "Title", subtitle: "Subtitle", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
      { image: "assets/photography/20200717-085631_Nagarro_327.jpg", title: "Title", subtitle: "Subtitle", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
    ],
  },
  render(s) {
    const cards = (s.cards || []).slice(0, 3).map(card).join("");
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      `<div class="v2f-list reveal">${cards}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
