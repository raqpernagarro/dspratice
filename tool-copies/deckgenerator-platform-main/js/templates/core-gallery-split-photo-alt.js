// Template: core/gallery-split-photo-alt — one large photo beside a narrow text column (logo-only top bar,
// copy, tag badges) at the right.
// Source Figma frame 109:5405.
import { esc } from "../components.js";
import { footerBar } from "../frame.js";
import { coreSplitText, vCard, SAMPLE } from "../blocks.js";

const ph = (src, style = "") => `<div class="ph"${style ? ` style="${style}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/gallery-split-photo-alt",
  slide: 51,
  figmaNode: "109:5405",
  family: "core", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "One large photo beside a narrow text column with tag badges on the right.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/gallery-split-photo-alt — large photo + narrow text column with badges at the right.",
  schema: {
    subtitle: "string", title: "string", body: "string — one or two paragraphs, separated by a blank line",
    badges: "array of 0–4 short strings — tags shown as dark pills",
    image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    badges: ["Badge", "Badge", "Badge"],
    image: SAMPLE[1],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "121" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          <div class="v2f-csplit-photos">${ph(s.image)}</div>
          ${coreSplitText({ meta: s.meta, logoOnly: true, subtitle: s.subtitle, title: s.title, body: s.body, small: true, badges: s.badges || [] }, 440)}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
