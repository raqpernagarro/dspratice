// Template: core/cards-grid-8-photo — header + a 4×2 grid of eight photos.
// Source Figma frame 109:5059.
import { frame, pageHeader } from "../frame.js";
import { photoGrid, SAMPLE } from "../blocks.js";

export default {
  name: "core/cards-grid-8-photo",
  slide: 26,
  figmaNode: "109:5059",
  family: "core", role: "cards", shape: "grid", count: 8, theme: "light", chrome: false,
  use: "A header with intro, then a 4×2 grid of eight photos.",
  media: ["photo"],
  capacity: { items: 8, min: 6, max: 8 },
  slots: { images: 8, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/cards-grid-8-photo — header + intro, then eight photos in a 4×2 grid.",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    images: "array of 8 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: SAMPLE.slice(0, 8),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "92" },
  },
  render(s) {
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      photoGrid((s.images || []).slice(0, 8), 4);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
