// Template: core/content-grid-6-photo — header + a 4-photo mosaic: a narrow
// column of two stacked tiles plus two large tiles. Source Figma frame 109:5003.
import { frame, pageHeader } from "../frame.js";
import { tile } from "../blocks.js";
import { SAMPLE } from "../blocks.js";

export default {
  name: "core/content-grid-6-photo",
  slide: 10,
  figmaNode: "109:5003",
  family: "core", role: "content", shape: "grid", count: 4, theme: "light", chrome: false,
  use: "A header with intro, then a photo mosaic — a narrow column of two stacked images beside two larger images.",
  media: ["photo"],
  capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/content-grid-6-photo — header + intro, then a 4-photo mosaic (2 stacked + 2 large).",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    images: "array of 4 photo paths (first 2 = stacked column, last 2 = large tiles)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: SAMPLE.slice(0, 4),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "89" },
  },
  render(s) {
    const im = s.images || [];
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      `<div class="v2f-mosaic reveal">
         <div class="v2f-mosaic-left">${tile(im[0])}${tile(im[1])}</div>
         ${tile(im[2])}${tile(im[3])}
       </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
