// Template: core/content-split-3-photo — split: a text panel (heading + body)
// on the left and a 2×2 photo grid on the right. Source Figma frame 109:5383.
import { footerBar } from "../frame.js";
import { splitTextPanel, photoPanel, SAMPLE } from "../blocks.js";

export default {
  name: "core/content-split-3-photo",
  slide: 15,
  figmaNode: "109:5383",
  family: "core", role: "content", shape: "split", count: 4, theme: "light", chrome: false,
  use: "A split layout: a heading and paragraph on the left, a 2×2 grid of photos on the right.",
  media: ["photo"],
  capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/content-split-3-photo — left text panel + right 2×2 photo grid.",
  schema: {
    subtitle: "string", title: "string", body: "string",
    images: "array of 4 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: SAMPLE.slice(0, 4),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "123" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-split reveal">
          ${splitTextPanel({ meta: s.meta, subtitle: s.subtitle, title: s.title, body: s.body })}
          ${photoPanel((s.images || []).slice(0, 4), 2)}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
