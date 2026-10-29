// Template: finance/highlights — a masonry "wall" of quote + stat cards (dark and
// grey tiles) with a SectionHeader in the first column. Light theme.
// Source Figma frame 110:18234 (finance/grid-03).
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { finCard, finCardCol } from "../finance-blocks.js";

export default {
  name: "finance/highlights",
  slide: 120,
  figmaNode: "110:18234",
  family: "finance",
  role: "cards",
  shape: "wall",
  theme: "light",
  chrome: false,
  use: "A highlights wall: press quotes and headline stats as dark / grey cards in a three-column masonry — an at-a-glance proof grid.",
  media: [],
  capacity: { items: 6, min: 4, max: 7 },
  slots: { images: 0, titles: 1, body: 0, stats: 6, icons: 0 },
  description: "finance/highlights — SectionHeader + a masonry wall of quote & stat cards.",
  schema: {
    caption: "string — eyebrow", title: "string — heading",
    lead: "{ quote, source, tone } — the tall first card",
    col2: "array of card { quote|stat, source, trend, tone, grow }",
    col3: "array of card { quote|stat, source, trend, tone, grow }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "FY 2024", title: "Highlights",
    lead: {
      quote:
        "“Company X forges a resilient platform for complex, critical AI use cases, offering seamless integration and scalability. This platform empowers enterprises to leverage advanced AI technologies swiftly and efficiently, ensuring they remain at the forefront of innovation in their industry.”",
      source: "– Twitter", tone: "dark", grow: 1,
    },
    col2: [
      { quote: "“A New Era in AI: Company X’s Breakthroughs Redefine Enterprise Solutions”", source: "– TechCrunch", tone: "dark", grow: 1 },
      { stat: "+10 new stores", tone: "dark", grow: 1 },
      { quote: "“Company X Revolutionises AI Integration, Setting New Industry Standards”", source: "– TechCrunch", tone: "dark", grow: 1 },
    ],
    col3: [
      { stat: "74M units sold", tone: "grey", grow: 1.8 },
      { stat: "14M Subscribers", trend: "up", tone: "dark", grow: 1 },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "287" },
  },
  render(s) {
    const header = `<div class="v2f-fin-wallhd">
      ${s.caption ? `<p class="v2f-caption">${esc(s.caption)}</p>` : ""}
      ${s.title ? `<p class="v2f-title">${esc(s.title)}</p>` : ""}
    </div>`;
    const middle = `<div class="v2f-fin-wall reveal">
      <div class="v2f-fin-wcol">${header}${finCard(s.lead || {})}</div>
      ${finCardCol(s.col2 || [])}
      ${finCardCol(s.col3 || [])}
    </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
