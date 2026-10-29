// Template: core/gallery-mosaic-3-photo — one large photo on the left, a wide
// photo plus a pair below it on the right. Source frame 109:5115.
import { frame } from "../frame.js";
import { tile, SAMPLE } from "../blocks.js";

export default {
  name: "core/gallery-mosaic-3-photo",
  slide: 46,
  figmaNode: "109:5115",
  family: "core", role: "gallery", shape: "mosaic", count: 4, theme: "light", chrome: false,
  use: "A photo mosaic: one large image on the left, a wide image and a pair of images on the right.",
  media: ["photo"],
  capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "core/gallery-mosaic-3-photo — big left photo + wide photo over a pair on the right.",
  schema: {
    images: "array of 4 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    images: SAMPLE.slice(0, 4),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "101" },
  },
  render(s) {
    const im = s.images || [];
    const middle = `
      <div class="v2f-mosaic reveal" style="padding-top:0">
        ${tile(im[0])}
        <div class="v2f-mosaic-left">
          ${tile(im[1])}
          <div class="v2f-mosaic-row">${tile(im[2])}${tile(im[3])}</div>
        </div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
