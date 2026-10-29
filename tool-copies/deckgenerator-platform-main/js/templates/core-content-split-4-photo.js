// Template: core/content-split-4-photo — split: a text panel on the left and a
// stack of three photos on the right (a row of two + one). Source frame 109:5395.
import { footerBar } from "../frame.js";
import { splitTextPanel, SAMPLE } from "../blocks.js";
import { esc } from "../components.js";

const ph = (src) => `<div class="ph">${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/content-split-4-photo",
  slide: 18,
  figmaNode: "109:5395",
  family: "core", role: "content", shape: "split", count: 3, theme: "light", chrome: false,
  use: "A heading and paragraph on the left; on the right two stacked photos beside one tall photo.",
  media: ["photo"],
  capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/content-split-4-photo — left text panel, right: two stacked photos + one tall.",
  schema: {
    subtitle: "string", title: "string", body: "string",
    images: "array of 3 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: SAMPLE.slice(0, 3),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "124" },
  },
  render(s) {
    // Figma 109:5395: text column, then two stacked photos beside one tall one.
    const im = s.images || [];
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          ${splitTextPanel({ meta: s.meta, subtitle: s.subtitle, title: s.title, body: s.body })}
          <div class="v2f-csplit-photos"><div class="row">
            <div class="v2f-csplit-photos">${ph(im[0])}${ph(im[1])}</div>${ph(im[2])}
          </div></div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
