// Template: core/cards-single-photo — split: a text panel (heading + body) on
// the left and one large photo on the right. Source Figma frame 109:5367.
import { footerBar } from "../frame.js";
import { splitTextPanel, photoPanel } from "../blocks.js";

export default {
  name: "core/cards-single-photo",
  slide: 22,
  figmaNode: "109:5367",
  family: "core", role: "cards", shape: "single", count: 1, theme: "light", chrome: false,
  use: "A heading and paragraph on the left beside one large photo on the right. A single featured card.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/cards-single-photo — left text panel + one large photo on the right.",
  schema: {
    subtitle: "string", title: "string", body: "string", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    image: "assets/photography/20200717-120518_Nagarro_4470_edit.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "121" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-split reveal">
          ${splitTextPanel({ meta: s.meta, subtitle: s.subtitle, title: s.title, body: s.body })}
          ${photoPanel(s.image ? [s.image] : [], 1)}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
