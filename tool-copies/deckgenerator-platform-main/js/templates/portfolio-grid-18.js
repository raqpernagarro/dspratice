// Template: portfolio/grid-18 — a heading (e.g. "Instagram") + paragraph on a
// narrow left column, a centered 3×3 grid of square thumbnails on the right.
// Source Figma frame 109:10665.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { tile, SAMPLE } from "../blocks.js";

export default {
  name: "portfolio/grid-18",
  slide: 107,
  figmaNode: "109:10665",
  family: "portfolio", role: "text", shape: "split", theme: "light", chrome: false,
  use: "A heading + paragraph on a narrow left column, a centered 3×3 grid of square thumbnails on the right.",
  media: ["photo"],
  capacity: { items: 9, min: 3, max: 9 },
  slots: { images: 9, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "portfolio/grid-18 — heading + paragraph left, 3×3 square photo grid right.",
  schema: {
    title: "string", body: "string", images: "array of up to 9 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Instagram",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: [...SAMPLE, ...SAMPLE].slice(0, 9),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "202" },
  },
  render(s) {
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c between" style="flex:0 0 560px">
          <p class="v2f-pf-lead">${esc(s.title ?? "")}</p>
          <div class="v2f-pf-blk">${s.body ? `<p>${esc(s.body)}</p>` : ""}</div>
        </div>
        <div class="c"><div class="v2f-pf-sqgrid">${(s.images || []).slice(0, 9).map(tile).join("")}</div></div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
