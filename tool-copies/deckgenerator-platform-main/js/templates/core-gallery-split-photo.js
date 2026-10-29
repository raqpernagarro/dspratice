// Template: core/gallery-split-photo — a narrow text column (logo-only top bar,
// subtitle + title, one or two paragraphs, a row of dark badges) beside one
// large photo. Source frame 109:5349. The badges are what set it apart from
// core/cards-single-photo (wider column, full top bar, no badges).
import { footerBar } from "../frame.js";
import { coreSplitText } from "../blocks.js";
import { esc } from "../components.js";

export default {
  name: "core/gallery-split-photo",
  slide: 50,
  figmaNode: "109:5349",
  family: "core", role: "gallery", shape: "split", count: 1, theme: "light", chrome: false,
  use: "A narrow text column with tag badges beside one large photo: a project, product or offer and its keywords.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/gallery-split-photo — narrow text column + tag badges, one large photo.",
  intent: {
    bestFor: ["one project, product or offer described in a paragraph or two, tagged with 2–4 keywords (technologies, industries, services)"],
    holds: "a title, up to two short paragraphs, and 2–4 one- or two-word badges",
    itemChars: 420,
    avoid: ["content with no natural tags (use core/cards-single-photo)", "lists of several points"],
    feel: "visual",
    needs: ["photo"],
  },
  schema: {
    subtitle: "string", title: "string",
    body: "string — one or two paragraphs, separated by a blank line",
    badges: "array of 2–4 short strings — tags shown as dark pills",
    image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    badges: ["Badge", "Badge", "Badge"],
    image: "assets/photography/20200717-085451_Nagarro_4227.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "119" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          ${coreSplitText({ meta: s.meta, logoOnly: true, subtitle: s.subtitle, title: s.title, body: s.body, small: true, badges: s.badges || [] }, 440)}
          <div class="v2f-csplit-photos"><div class="ph">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div></div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
