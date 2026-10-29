// Template: core/gallery-twocol-photo — a text column (top bar, heading, paragraphs, tag badges)
// beside a wide photo with a short text block under it.
// Source Figma frame 109:5359.
import { esc } from "../components.js";
import { footerBar } from "../frame.js";
import { coreSplitText, vCard, SAMPLE } from "../blocks.js";

const ph = (src, style = "") => `<div class="ph"${style ? ` style="${style}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/gallery-twocol-photo",
  slide: 56,
  figmaNode: "109:5359",
  family: "core", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "A text column with tag badges beside a wide photo with a short titled caption under it.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 2, subtitles: 1, body: 2, stats: 0, icons: 0 },
  description: "core/gallery-twocol-photo — text column + badges, wide photo with a text block below.",
  schema: {
    subtitle: "string", title: "string",
    paragraphs: "array of 1–2 intro paragraphs", pills: "array of 0–4 short tags, shown as dark badges",
    image: "string — photo path",
    note: "{ title, body } — the text block under the photo",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title",
    paragraphs: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."], pills: ["Badge", "Badge", "Badge"],
    image: SAMPLE[0],
    note: { body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
    meta: { studio: "Product Studio", name: "Presentation Name", page: "126" },
  },
  render(s) {
    // Older slides carry the text under the photo as `caption`.
    const note = s.note || (s.caption ? { body: s.caption } : {});
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          ${coreSplitText({ meta: s.meta, subtitle: s.subtitle, title: s.title, body: s.paragraphs || [], small: true, badges: s.pills || [] }, 640)}
          <div class="v2f-csplit-photos" style="gap:32px;">
            ${ph(s.image, "flex:0 0 624px;")}
            <article class="v2f-tcard" style="width:400px;">
              <div class="v2f-ctitle">${note.title ? `<p class="v2f-ct">${esc(note.title)}</p>` : ""}</div>
              ${note.body ? `<p class="v2f-cb">${esc(note.body)}</p>` : ""}
            </article>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
