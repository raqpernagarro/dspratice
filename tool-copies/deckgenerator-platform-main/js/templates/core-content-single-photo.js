// Template: core/content-single-photo — header + one full-width image, light theme.
// Source Figma frame 109:4986. Uses the shared v2 frame (js/frame.js + .v2f-* CSS).
import { esc } from "../components.js";
import { frame, pageHeader } from "../frame.js";

export default {
  name: "core/content-single-photo",
  slide: 7,
  figmaNode: "109:4986",
  family: "core",
  role: "content",
  shape: "single",
  theme: "light",
  chrome: false,
  use: "A header with title and body, plus one full-width image below. Text-led with a supporting visual.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/content-single-photo — header + intro, then one full-width photo.",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    image: "string — full-width photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    image: "assets/photography/20200717-120518_Nagarro_4470_edit.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "97" },
  },
  render(s) {
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      `<div class="v2f-list reveal"><figure class="v2f-col" style="margin:0">
         <div class="v2f-imgbox">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
       </figure></div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
