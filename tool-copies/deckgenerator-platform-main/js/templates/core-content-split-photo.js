// Template: core/content-split-photo — a full-bleed 4×2 grid of eight photos
// under the top bar. Source Figma frame 109:5183.
import { frame } from "../frame.js";
import { photoGrid, SAMPLE } from "../blocks.js";

export default {
  name: "core/content-split-photo",
  slide: 12,
  figmaNode: "109:5183",
  family: "core", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A dense photo wall: eight images in a 4×2 grid filling the slide. Purely visual.",
  media: ["photo"],
  capacity: { items: 8, min: 6, max: 8 },
  slots: { images: 8, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "core/content-split-photo — full-bleed 4×2 grid of eight photos.",
  schema: {
    images: "array of 8 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    images: SAMPLE.slice(0, 8),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "108" },
  },
  render(s) {
    return frame(photoGrid((s.images || []).slice(0, 8), 4, false), { meta: s.meta, footer: s.footer });
  },
};
