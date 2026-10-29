// Template: main/data-03 — a full-bleed team photo with a teal veil, an underlined
// "At a Glance" heading, and a cluster of translucent stat bubbles. Source Figma
// frame 342:37500.
import { esc } from "../components.js";
import { NAGARRO_LOGO } from "../logo.js";

const TEAM_PHOTO = "assets/photography/AZ1A4324.jpg";

// Bubble layout in the 1920×1080 stage — {x,y} are centre coords, d the diameter.
const BUBBLES = [
  { num: "1000", sup: "+", lbl: "Customers", d: 400, x: 1380, y: 655, ns: 100 },
  { num: "25+", lbl: "Years", d: 262, x: 1120, y: 545, ns: 60 },
  { num: "9.5", sup: "+", lbl: "Satisfaction", d: 272, x: 1695, y: 505, ns: 60 },
  { num: "17,000", sup: "+", lbl: "People", d: 300, x: 1205, y: 838, ns: 62 },
  { num: "$600M", sup: "USD", lbl: "Revenue", d: 300, x: 1660, y: 802, ns: 62 },
  { num: "32", lbl: "Countries", d: 232, x: 1452, y: 872, ns: 52 },
];

export default {
  name: "main/data-03", slide: -54, figmaNode: "342:37500",
  family: "main", role: "content", shape: "full", theme: "dark", chrome: false,
  use: "A full-bleed team photo with a teal veil and a cluster of translucent headline-figure bubbles.",
  media: ["photo"], capacity: { items: 6, min: 3, max: 6 },
  slots: { images: 1, titles: 1, body: 0, stats: 6, icons: 0 },
  description: "main/data-03 — full-bleed photo + 'At a Glance' stat bubbles.",
  schema: {
    title: "string — heading", image: "photo URL",
    bubbles: "array of { num, sup, lbl, d, x, y, ns }",
    meta: "{ studio, name, page }",
  },
  example: {
    title: "At a Glance:", image: TEAM_PHOTO, bubbles: BUBBLES,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const bubbles = (s.bubbles || BUBBLES).map((b) => `
      <div class="v2f-mn-data3-bubble" style="width:${b.d}px;height:${b.d}px;left:${b.x}px;top:${b.y}px;">
        <span class="bnum" style="font-size:${b.ns}px;">${esc(b.num)}${b.sup ? `<sup>${esc(b.sup)}</sup>` : ""}</span>
        <span class="blbl" style="font-size:${Math.round(b.d * 0.11)}px;">${esc(b.lbl)}</span>
      </div>`).join("");
    return `
      <div class="v2f-root v2f-mn-data3-root">
        <div class="v2f-mn-data3 reveal">
          <div class="v2f-mn-data3-photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
          <div class="v2f-mn-data3-veil"></div>
          <span class="v2f-logo">${NAGARRO_LOGO}</span>
          <p class="v2f-mn-data3-title">${esc(s.title ?? "At a Glance:")}</p>
          <div class="v2f-mn-data3-bubbles">${bubbles}</div>
        </div>
      </div>`;
  },
};
