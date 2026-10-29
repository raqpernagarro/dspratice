// Template: core/cards-grid-6-photo — header + a 2×3 grid of six photos.
// Source Figma frame 109:5023.
import { frame, pageHeader } from "../frame.js";
import { photoGrid, SAMPLE } from "../blocks.js";

export default {
  name: "core/cards-grid-6-photo",
  slide: 25,
  figmaNode: "109:5023",
  family: "core", role: "cards", shape: "grid", count: 6, theme: "light", chrome: false,
  use: "A header with intro, then a 2×3 grid of six photos.",
  media: ["photo"],
  capacity: { items: 6, min: 5, max: 6 },
  slots: { images: 6, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/cards-grid-6-photo — header + intro, then six photos in a 2×3 grid.",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    images: "array of 6 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: SAMPLE.slice(0, 6),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "91" },
  },
  render(s) {
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      photoGrid((s.images || []).slice(0, 6), 3);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
