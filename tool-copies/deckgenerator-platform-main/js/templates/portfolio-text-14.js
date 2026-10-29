// Template: portfolio/text-14 — a "Key Elements" header (title + intro) above a
// 4-column grid of photos. Source Figma frame 109:10683.
import { frame, pageHeader } from "../frame.js";
import { photoGrid, SAMPLE } from "../blocks.js";

export default {
  name: "portfolio/text-14",
  slide: 108,
  figmaNode: "109:10683",
  family: "portfolio", role: "text", shape: "grid", count: 8, theme: "light", chrome: false,
  use: "A header (title + intro) above a 4-column grid of photos.",
  media: ["photo"],
  capacity: { items: 8, min: 4, max: 8 },
  slots: { images: 8, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "portfolio/text-14 — header + 4-col photo grid.",
  schema: {
    title: "string", intro: "string", images: "array of up to 8 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Key Elements",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: [...SAMPLE, ...SAMPLE].slice(0, 8),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "203" },
  },
  render(s) {
    const middle = pageHeader({ title: s.title, intro: s.intro }) + photoGrid((s.images || []).slice(0, 8), 4);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
