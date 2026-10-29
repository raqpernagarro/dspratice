// Template: portfolio/grid-07 — a "Skills" eyebrow + two plain columns of skills,
// vertically centered, no photo. Source Figma frame 109:10216.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "portfolio/grid-07",
  slide: 76,
  figmaNode: "109:10216",
  family: "portfolio", role: "skills", shape: "cols", theme: "light", chrome: false,
  use: "A skills eyebrow + two plain columns of skills, vertically centered.",
  media: [],
  capacity: { items: 12, min: 2, max: 14 },
  slots: { images: 0, titles: 0, subtitles: 2, body: 0, stats: 0, icons: 0 },
  description: "portfolio/grid-07 — two plain columns of skills.",
  schema: {
    eyebrow: "string", colA: "array of strings", colB: "array of strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    eyebrow: "Skills",
    colA: ["Figma", "Photoshop", "After Effects", "Premiere Pro", "Cinema 4D"],
    colB: ["Midjourney", "Stable Diffusion", "Illustrator", "InDesign", "HTML/CSS"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "171" },
  },
  render(s) {
    const col = (items = []) => `<div class="v2f-pf-skillcol">${items.map((i) => `<p>${esc(i)}</p>`).join("")}</div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <p class="v2f-pf-eyebrow reveal" style="flex:0 0 auto">${esc(s.eyebrow ?? "Skills")}</p>
        <div class="v2f-pf-skillcols reveal">${col(s.colA || [])}${col(s.colB || [])}</div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
