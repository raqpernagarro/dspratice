// Template: core/gallery-split-4-photo-alt — one large photo on the left beside
// a text column (top bar, subtitle + title, paragraph) on the right: the mirror
// of core/cards-single-photo. Source frame 109:5415. (It used to render a 2×3
// photo wall, which is not what the Figma frame shows.)
import { footerBar } from "../frame.js";
import { coreSplitText } from "../blocks.js";
import { esc } from "../components.js";

export default {
  name: "core/gallery-split-4-photo-alt",
  slide: 49,
  figmaNode: "109:5415",
  family: "core", role: "gallery", shape: "split", count: 1, theme: "light", chrome: false,
  use: "One large photo on the left beside a heading and paragraph on the right.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/gallery-split-4-photo-alt — large photo left, text column right.",
  intent: {
    bestFor: ["one picture that carries the point, with a paragraph explaining it",
      "varying the side after a text-left photo slide"],
    holds: "a title and one paragraph of up to about 260 characters, one photo",
    itemChars: 300,
    avoid: ["lists, figures or several points", "content with no relevant photo"],
    feel: "visual",
    needs: ["photo"],
  },
  schema: {
    subtitle: "string", title: "string", body: "string", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    image: "assets/photography/20200717-090948_Nagarro_402.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "126" },
  },
  render(s) {
    // Saved slides from the old photo-wall render carry `images`, not `image`.
    const src = s.image ?? (s.images || [])[0];
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          <div class="v2f-csplit-photos"><div class="ph">${src ? `<img src="${esc(src)}" alt="">` : ""}</div></div>
          ${coreSplitText({ meta: s.meta, subtitle: s.subtitle, title: s.title, body: s.body }, 640)}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
