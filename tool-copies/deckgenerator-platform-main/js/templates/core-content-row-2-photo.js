// Template: core/content-row-2-photo — header + two photos side by side.
// Source Figma frame 109:4990.
import { frame, pageHeader } from "../frame.js";
import { photoGrid, SAMPLE } from "../blocks.js";

export default {
  name: "core/content-row-2-photo",
  slide: 8,
  figmaNode: "109:4990",
  family: "core", role: "content", shape: "row", count: 2, theme: "light", chrome: false,
  use: "A header with intro, then two large photos side by side. Text-led with two supporting visuals.",
  media: ["photo"],
  capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/content-row-2-photo — header + intro, then two photos in a row.",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    images: "array of 2 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: SAMPLE.slice(0, 2),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "87" },
  },
  render(s) {
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      photoGrid((s.images || []).slice(0, 2), 2);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
