// Template: core/cards-split-6 — a text column (top bar, heading, paragraphs, tag
// badges) beside a 2×3 grid of tinted icon cards (category, title, text).
// Source Figma frame 109:5433.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { icon } from "../icons.js";

const card = (c = {}) => `
  <div class="v2f-ic-card">
    <span class="ic">${icon(c.icon || "person-checkmark-and-home")}</span>
    <div class="hd">
      ${c.category ? `<p class="cat">${esc(c.category)}</p>` : ""}
      ${c.title ? `<p class="ttl">${esc(c.title)}</p>` : ""}
    </div>
    ${c.body ? `<p class="bdy">${esc(c.body)}</p>` : ""}
  </div>`;

export default {
  name: "core/cards-split-6",
  slide: 34,
  figmaNode: "109:5433",
  family: "core", role: "cards", shape: "split", count: 6, theme: "light", chrome: false,
  use: "A text column with tag badges beside a 2×3 grid of tinted icon cards, each a category, title and text. No imagery.",
  media: [],
  capacity: { items: 6, min: 4, max: 6 },
  slots: { images: 0, titles: 6, body: 6, stats: 0, icons: 6 },
  description: "core/cards-split-6 — text column + badges, 2×3 tinted icon cards.",
  intent: {
    bestFor: ["four to six services, capabilities or principles, each a short name and one line", "an offer explained in a paragraph with its parts as cards"],
    holds: "a heading and up to two short paragraphs; 4–6 cards of a category, a title of up to about 20 characters and one sentence of up to about 90 characters",
    itemChars: 100,
    avoid: ["card text longer than one sentence (the cards are 292px tall)", "content that needs photos"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string",
    paragraphs: "array of 1–2 intro paragraphs",
    pills: "array of 0–4 short tags, shown as dark badges",
    cards: "array of up to 6 {category, title, body, icon} — icon is a brand icon name",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", subtitle: "Subtitle",
    paragraphs: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."],
    pills: ["Badge", "Badge", "Badge"],
    cards: Array.from({ length: 6 }, () => ({ category: "Category", title: "Lorem ipsum", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "139" },
  },
  render(s) {
    const paras = (s.paragraphs || []).filter(Boolean);
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          <div class="v2f-csplit-text v2f-ic-text" style="width:616px">
            ${topBar(s.meta)}
            <div class="v2f-csplit-head">
              <div class="v2f-heading" style="width:auto;">
                ${s.caption ? `<p class="v2f-caption">${esc(s.caption)}</p>` : ""}
                ${s.title ? `<p class="v2f-title">${esc(s.title)}</p>` : ""}
                ${s.subtitle ? `<p class="v2f-h5m">${esc(s.subtitle)}</p>` : ""}
              </div>
              <div class="v2f-csplit-copy sm">${paras.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
            </div>
            ${(s.pills || []).length ? `<div class="v2f-csplit-badges">${s.pills.map((b) => `<span>${esc(b)}</span>`).join("")}</div>` : ""}
          </div>
          <div class="v2f-ic-grid">${(s.cards || []).slice(0, 6).map(card).join("")}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
