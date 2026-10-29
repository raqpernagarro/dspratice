// Template: core/content-twocol — text-only: heading block + intro paragraph
// (two columns of text), no imagery. Source Figma frame 109:4983.
import { frame, pageHeader } from "../frame.js";

export default {
  name: "core/content-twocol",
  slide: 6,
  figmaNode: "109:4983",
  family: "core", role: "content", shape: "twocol", theme: "light", chrome: false,
  use: "A text-only content slide: a section heading on the left and an intro paragraph on the right.",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/content-twocol — heading block + intro paragraph, no imagery.",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "85" },
  },
  render(s) {
    const middle = pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true });
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
