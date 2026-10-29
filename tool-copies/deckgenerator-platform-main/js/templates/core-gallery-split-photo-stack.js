// Template: core/gallery-split-photo-stack — a text column (top bar, subtitle +
// title, paragraph) beside a photo panel: one wide photo over two side by side.
// Source frame 109:5373.
// Named core/gallery-split-4-photo in Figma; renamed here because that name did not describe it.
import { footerBar } from "../frame.js";
import { coreSplitText } from "../blocks.js";
import { esc } from "../components.js";

const ph = (src) => `<div class="ph">${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/gallery-split-photo-stack",
  slide: 48,
  figmaNode: "109:5373",
  family: "core", role: "gallery", shape: "split", count: 3, theme: "light", chrome: false,
  use: "A heading and paragraph on the left beside three photos: one wide on top, two below.",
  media: ["photo"],
  capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/gallery-split-photo-stack — text column + one wide photo over two.",
  intent: {
    bestFor: ["a place, event or team told in one paragraph with a few pictures of it"],
    holds: "a title and one paragraph of up to about 260 characters, three photos",
    itemChars: 300,
    avoid: ["lists, figures or several points", "content with only one relevant picture (use core/cards-single-photo)"],
    feel: "visual",
    needs: ["photo"],
  },
  schema: {
    subtitle: "string", title: "string", body: "string",
    images: "array of 3 photo paths — the first is the wide one on top",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: [
      "assets/photography/20200717-084726_Nagarro_295.jpg",
      "assets/photography/20200717-085451_Nagarro_4227.jpg",
      "assets/photography/20200717-085631_Nagarro_327.jpg",
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "120" },
  },
  render(s) {
    const [a, b, c] = s.images || [];
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          ${coreSplitText({ meta: s.meta, subtitle: s.subtitle, title: s.title, body: s.body }, 640)}
          <div class="v2f-csplit-photos">${ph(a)}<div class="row">${ph(b)}${ph(c)}</div></div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
