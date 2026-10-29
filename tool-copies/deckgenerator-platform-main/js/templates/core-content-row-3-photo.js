// Template: core/content-row-3-photo — header + three photos side by side.
// Source Figma frame 109:4996.
import { frame, pageHeader } from "../frame.js";
import { photoGrid, SAMPLE } from "../blocks.js";

export default {
  name: "core/content-row-3-photo",
  slide: 9,
  figmaNode: "1184:33976",
  family: "core", role: "content", shape: "row", count: 3, theme: "light", chrome: false,
  use: "A header with intro, then three photos side by side. Text-led with three supporting visuals.",
  media: ["photo"],
  capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/content-row-3-photo — header + intro, then three photos in a row.",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    images: "array of 3 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: SAMPLE.slice(0, 3),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "88" },
  },
  render(s) {
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      photoGrid((s.images || []).slice(0, 3), 3);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
