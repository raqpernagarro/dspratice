// Template: core/gallery-single-photo — one large photo filling the body.
// Source frame 109:5555.
import { frame } from "../frame.js";
import { photoGrid } from "../blocks.js";

export default {
  name: "core/gallery-single-photo",
  slide: 44,
  figmaNode: "109:5555",
  family: "core", role: "gallery", shape: "single", count: 1, theme: "light", chrome: false,
  use: "One large photo filling the slide body between the top bar and footer.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "core/gallery-single-photo — one large photo filling the body.",
  schema: {
    image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    image: "assets/photography/20200717-120518_Nagarro_4470_edit.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "142" },
  },
  render(s) {
    return frame(photoGrid(s.image ? [s.image] : [], 1, false), { meta: s.meta, footer: s.footer });
  },
};
