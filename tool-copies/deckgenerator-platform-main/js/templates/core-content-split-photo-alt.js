// Template: core/content-split-photo-alt — mirror split: two stacked photos on
// the left, a text panel on the right. Source Figma frame 109:5338.
import { footerBar } from "../frame.js";
import { coreSplitText, SAMPLE } from "../blocks.js";
import { esc } from "../components.js";

const ph = (src) => `<div class="ph">${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/content-split-photo-alt",
  slide: 14,
  figmaNode: "109:5338",
  family: "core", role: "content", shape: "split", count: 2, theme: "light", chrome: false,
  use: "A narrow text column with optional tag badges beside two tall photos side by side.",
  media: ["photo"],
  capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/content-split-photo-alt — narrow text column + badges, two tall photos side by side.",
  schema: {
    subtitle: "string", title: "string", body: "string",
    badges: "array of 0–4 short strings — tags shown as dark pills",
    images: "array of 2 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    badges: ["Badge", "Badge", "Badge"],
    subtitle: "Subtitle", title: "Title",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: SAMPLE.slice(0, 2),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "116" },
  },
  render(s) {
    // Figma 109:5338: narrow text column (logo-only top bar, copy, badges),
    // then two tall photos side by side.
    const im = s.images || [];
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          ${coreSplitText({ meta: s.meta, logoOnly: true, subtitle: s.subtitle, title: s.title, body: s.body, small: true, badges: s.badges || [] }, 440)}
          <div class="v2f-csplit-photos"><div class="row">${ph(im[0])}${ph(im[1])}</div></div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
