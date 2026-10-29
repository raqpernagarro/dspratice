// Template: core/gallery-split-3-photo-alt — a narrow text column (logo-only top bar, copy, tag badges)
// beside three tall photos.
// Source Figma frame 109:5304.
import { esc } from "../components.js";
import { footerBar } from "../frame.js";
import { coreSplitText, vCard, SAMPLE } from "../blocks.js";

const ph = (src, style = "") => `<div class="ph"${style ? ` style="${style}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/gallery-split-3-photo-alt",
  slide: 53,
  figmaNode: "109:5304",
  family: "core", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "A narrow text column with tag badges beside three tall photos.",
  media: ["photo"],
  capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/gallery-split-3-photo-alt — narrow text column with badges + three tall photos.",
  schema: {
    subtitle: "string", title: "string", body: "string — one or two paragraphs, separated by a blank line",
    badges: "array of 0–4 short strings — tags shown as dark pills",
    images: "array of 3 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    badges: ["Badge", "Badge", "Badge"],
    images: SAMPLE.slice(3, 6),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "123" },
  },
  render(s) {
    const im = s.images || [];
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          ${coreSplitText({ meta: s.meta, logoOnly: true, subtitle: s.subtitle, title: s.title, body: s.body, small: true, badges: s.badges || [] }, 442)}
          <div class="v2f-csplit-photos"><div class="row">${ph(im[0])}${ph(im[1])}${ph(im[2])}</div></div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
