// Template: core/gallery-split-2-photo-alt — a narrow text column (logo-only top bar, copy, tag badges),
// a tall photo, and a photo + text card.
// Source Figma frame 109:5327.
import { esc } from "../components.js";
import { footerBar } from "../frame.js";
import { coreSplitText, vCard, SAMPLE } from "../blocks.js";

const ph = (src, style = "") => `<div class="ph"${style ? ` style="${style}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/gallery-split-2-photo-alt",
  slide: 55,
  figmaNode: "109:5327",
  family: "core", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "A narrow text column with tag badges, one tall photo, and a photo card with a title and text.",
  media: ["photo"],
  capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 2, subtitles: 2, body: 2, stats: 0, icons: 0 },
  description: "core/gallery-split-2-photo-alt — narrow text column + badges, tall photo, photo/text card.",
  schema: {
    subtitle: "string", title: "string", body: "string — one or two paragraphs, separated by a blank line",
    badges: "array of 0–4 short strings — tags shown as dark pills",
    images: "array of 2 photo paths — the tall one, then the card's",
    card: "{ title, subtitle, body } — under the second photo",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    badges: ["Badge", "Badge", "Badge"],
    images: SAMPLE.slice(2, 4),
    card: { title: "Title", subtitle: "Subtitle", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
    meta: { studio: "Product Studio", name: "Presentation Name", page: "125" },
  },
  render(s) {
    const im = s.images || [];
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          ${coreSplitText({ meta: s.meta, logoOnly: true, subtitle: s.subtitle, title: s.title, body: s.body, small: true, badges: s.badges || [] }, 440)}
          <div class="v2f-csplit-photos"><div class="row">${ph(im[0])}<div style="flex:1 1 0;min-width:0;display:flex;">${vCard({ ...(s.card || {}), image: im[1] })}</div></div></div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
