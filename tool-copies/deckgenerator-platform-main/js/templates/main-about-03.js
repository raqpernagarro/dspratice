// Template: main/about-03 — a full-width heading over three value cards (mint icon in
// a white disc + title + body) along the bottom. Source Figma frame 342:37466.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { icon } from "../icons.js";

const CARDS = [
  { icon: "hand-heart", title: "Our clients", body: "Nagarro helps them transform, adapt, and build new ways into the future through an entrepreneurial, agile, and caring mindset." },
  { icon: "group-of-people", title: "Our clients", body: "Nagarro helps them transform, adapt, and build new ways into the future through an entrepreneurial, agile, and caring mindset." },
  { icon: "person-heart", title: "Our clients", body: "Nagarro helps them transform, adapt, and build new ways into the future through an entrepreneurial, agile, and caring mindset." },
];

export default {
  name: "main/about-03", slide: -58, figmaNode: "342:37466",
  family: "main", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-width heading over three value cards, each with a mint icon, a title and body.",
  media: ["icon"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 3 },
  description: "main/about-03 — heading + three icon value cards along the bottom.",
  schema: {
    title: "string — heading", cards: "array of { icon, title, body }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Nagarro is a global leader in technology and human centered digital solutions.",
    cards: CARDS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cards = (s.cards || CARDS).map((c) => `
      <div class="v2f-mn-about3-card">
        <div class="ico">${icon(c.icon || "hand-heart")}</div>
        <div class="ctext">
          <p class="ct">${esc(c.title ?? "")}</p>
          <p class="cb">${esc(c.body ?? "")}</p>
        </div>
      </div>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-about3 reveal">
          <p class="v2f-mn-h">${esc(s.title ?? "")}</p>
          <div class="v2f-mn-about3-cards">${cards}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
