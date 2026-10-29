// Template: core/gallery-grid-18-photo — a 6×3 photo wall. Source frame 109:5253.
import { frame } from "../frame.js";
import { photoGrid, SAMPLE } from "../blocks.js";

export default {
  name: "core/gallery-grid-18-photo",
  slide: 43,
  figmaNode: "109:5253",
  family: "core", role: "gallery", shape: "grid", count: 18, theme: "light", chrome: false,
  use: "A dense photo wall: eighteen images in a 6×3 grid. A contact sheet or large gallery.",
  media: ["photo"],
  capacity: { items: 18, min: 12, max: 18 },
  slots: { images: 18, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "core/gallery-grid-18-photo — 6×3 photo wall (18 images).",
  schema: {
    images: "array of 18 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    images: Array.from({ length: 18 }, (_, i) => SAMPLE[i % SAMPLE.length]),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "112" },
  },
  render(s) {
    return frame(photoGrid((s.images || []).slice(0, 18), 6, false), { meta: s.meta, footer: s.footer });
  },
};
