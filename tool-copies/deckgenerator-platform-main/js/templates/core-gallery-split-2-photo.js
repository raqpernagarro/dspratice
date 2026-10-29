// Template: core/gallery-split-2-photo — six photos in a 3×2 grid under the top bar. No text.
// Source Figma frame 109:5172.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { SAMPLE } from "../blocks.js";

const ph = (src, style = "") => `<div class="ph"${style ? ` style="${style}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/gallery-split-2-photo",
  slide: 54,
  figmaNode: "109:5172",
  family: "core", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "Six photos in a 3×2 grid filling the slide under the top bar. No text.",
  media: ["photo"],
  capacity: { items: 6, min: 6, max: 6 },
  slots: { images: 6, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "core/gallery-split-2-photo — 3×2 photo grid, no text.",
  schema: {
    images: "array of 6 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    images: SAMPLE.slice(0, 6),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "124" },
  },
  render(s) {
    const im = s.images || [];
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-csplit-photos reveal" style="height:auto;flex:1 1 0;">
          <div class="row">${ph(im[0])}${ph(im[1])}${ph(im[2])}</div>
          <div class="row">${ph(im[3])}${ph(im[4])}${ph(im[5])}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
