// Template: core/gallery-mosaic-4-photo — one wide photo beside two tall photos.
// Source frame 109:5124.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { SAMPLE } from "../blocks.js";

const tile = (src, cls = "") => `<div class="v2f-tile ${cls}">${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/gallery-mosaic-4-photo",
  slide: 47,
  figmaNode: "109:5124",
  family: "core", role: "gallery", shape: "mosaic", count: 3, theme: "light", chrome: false,
  use: "A photo mosaic: one wide image beside two tall images.",
  media: ["photo"],
  capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "core/gallery-mosaic-4-photo — one wide photo + two tall photos.",
  schema: {
    images: "array of 3 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    images: SAMPLE.slice(0, 3),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "102" },
  },
  render(s) {
    const im = s.images || [];
    const middle = `
      <div class="v2f-mosaic reveal" style="padding-top:0">
        ${tile(im[0], "wide")}${tile(im[1])}${tile(im[2])}
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
