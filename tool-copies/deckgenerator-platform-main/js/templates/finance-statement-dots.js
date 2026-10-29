// Template: finance/statement-dots — a big-number statement over two dot-waffle
// cards comparing counts (each dot = one unit). Light theme.
// Source Figma frame 110:18309 (finance/split-02).
import { frame } from "../frame.js";
import { finHead, finWaffleCard } from "../finance-blocks.js";

export default {
  name: "finance/statement-dots",
  slide: 124,
  figmaNode: "110:18309",
  family: "finance",
  role: "chart",
  shape: "waffle",
  theme: "light",
  chrome: false,
  use: "A headline count in words, illustrated by two dot-waffle cards where each dot represents one unit (deals, customers, wins).",
  media: [],
  capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 0, titles: 1, body: 0, stats: 2, icons: 0 },
  description: "finance/statement-dots — big-number statement + two dot-waffle proportion cards.",
  intent: { bestFor: ["a headline count shown as dots, one per unit"], holds: "2 counts of whole units (deals, customers)", avoid: ["percentages or currency", "large counts over ~100"], feel: "data", needs: ["two whole-number counts"] },
  schema: {
    caption: "string — eyebrow",
    statement: "string — the headline count in words",
    cards: "array of 2 { label, count:number } (each dot = one unit, max ~50)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Deals",
    statement: "We closed 78 deals worth at least $1 million",
    cards: [
      { label: "$1 – $10 million", count: 50 },
      { label: "$10 million +", count: 28 },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "291" },
  },
  render(s) {
    const cards = (s.cards || []).slice(0, 2).map(finWaffleCard).join("");
    const middle =
      finHead({ caption: s.caption, statement: s.statement }) +
      `<div class="v2f-fin-dots reveal">${cards}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
