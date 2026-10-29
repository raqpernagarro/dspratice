// Template: core/gallery-fullbleed-photo — one photo bleeding to every edge,
// no chrome. Source frame 109:5552.
import { esc } from "../components.js";

export default {
  name: "core/gallery-fullbleed-photo",
  slide: 45,
  figmaNode: "109:5552",
  family: "core", role: "gallery", shape: "fullbleed", count: 1, theme: "light", chrome: false,
  use: "A single photo bleeding edge to edge, no logo or footer. Maximum visual impact.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "core/gallery-fullbleed-photo — one full-bleed photo, no chrome.",
  schema: { image: "string — photo path" },
  example: { image: "assets/photography/20200717-085451_Nagarro_4227.jpg" },
  render(s) {
    return `<div class="v2f-fullbleed reveal">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>`;
  },
};
