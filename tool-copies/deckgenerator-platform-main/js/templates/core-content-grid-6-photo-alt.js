// Template: core/content-grid-6-photo-alt — mirror of content-grid-6-photo:
// two large tiles beside a narrow column of two stacked tiles, plus one more.
// Source Figma frame 109:5012.
import { frame, pageHeader } from "../frame.js";
import { tile, SAMPLE } from "../blocks.js";

export default {
  name: "core/content-grid-6-photo-alt",
  slide: 11,
  figmaNode: "109:5012",
  family: "core", role: "content", shape: "grid", count: 5, theme: "light", chrome: false,
  use: "A header with intro above five photos: two stacked, one tall, two stacked.",
  media: ["photo"],
  capacity: { items: 5, min: 4, max: 5 },
  slots: { images: 5, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/content-grid-6-photo-alt — header + intro, then five photos (2 stacked, 1 tall, 2 stacked).",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    images: "array of 5 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: SAMPLE.slice(0, 5),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "90" },
  },
  render(s) {
    // Figma 109:5012: the default PageHeader (680px heading, 48px subtitle)
    // tucked 8px under the top bar, then two stacked / one tall / two stacked.
    const im = s.images || [];
    const middle =
      `<div class="v2f-cg6a-head">${pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro })}</div>` +
      `<div class="v2f-mosaic v2f-cg6a reveal">
         <div class="v2f-mosaic-left">${tile(im[0])}${tile(im[1])}</div>
         ${tile(im[2])}
         <div class="v2f-mosaic-left">${tile(im[3])}${tile(im[4])}</div>
       </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
