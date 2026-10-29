// Template: pitch/grid-16 — six questions an investor will ask, as cards in three columns of two.
// Source Figma frame 110:37296.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-16", slide: 293, figmaNode: "110:37296",
  family: "pitch", role: "cards", shape: "grid", theme: "light", chrome: false,
  use: "A heading over six cards, each a category, a topic and the question to answer about it.",
  media: [], capacity: { items: 6, min: 4, max: 6 },
  slots: { images: 0, titles: 7, subtitles: 0, body: 6, stats: 0, icons: 0 },
  description: "pitch/grid-16 — heading + six category/topic/question cards.",
  intent: {
    bestFor: ["the traction metrics an investor expects: marketing, revenue, growth, partnerships, customers, traction"],
    holds: "an eyebrow, a title, and 4–6 cards of a category label, a topic of up to 18 characters, and a question of up to about 70 characters",
    itemChars: 70,
    avoid: ["answers rather than questions", "more than six cards"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string",
    cards: "array of 4–6 { category, title, question } — filled down each column in turn",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market", title: "Go-to-market",
    cards: [
      { category: "Category 1", title: "Marketing", question: "What are your main customer acquisition channels?" },
      { category: "Category 2", title: "Revenue", question: "How much are you generating each month or year?" },
      { category: "Category 3", title: "Growth", question: "How much are you growing each month?" },
      { category: "Category 4", title: "Partnerships", question: "Do you have any key partnerships established?" },
      { category: "Category 5", title: "Customers", question: "What is your current NPS?" },
      { category: "Category 6", title: "Traction", question: "What is your strategy for expanding into new markets?" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "33" },
    footer: PT_FOOTER,
  },
  render(s) {
    const cs = (s.cards || []).slice(0, 6);
    const card = (c) => `<div class="v2f-pt-qcard"><p class="c">${esc(c.category ?? "")}</p><p class="t">${esc(c.title ?? "")}</p><p class="q">${esc(c.question ?? "")}</p></div>`;
    const cols = [0, 2, 4].map((i) => cs.slice(i, i + 2)).filter((c) => c.length);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}
        <div class="v2f-pt-qcards reveal">${cols.map((c) => `<div class="v2f-pt-qcol">${c.map(card).join("")}</div>`).join("")}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
