// Template: portfolio/text-01 — a page header (title on the left, intro
// paragraph on the right) above two large side-by-side photos. Source Figma
// frame 109:10167. Reuses the shared pageHeader + photoGrid blocks.
import { frame, pageHeader } from "../frame.js";
import { photoGrid, SAMPLE } from "../blocks.js";

export default {
  name: "portfolio/text-01",
  slide: 72,
  figmaNode: "109:10167",
  family: "portfolio", role: "text", shape: "row", count: 2, theme: "light", chrome: false,
  use: "A page header (title + intro) above two large side-by-side photos.",
  media: ["photo"],
  capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/text-01 — header + two photos side by side.",
  schema: {
    title: "string", intro: "string", images: "array of 2 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Who we are",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: [SAMPLE[0], SAMPLE[3]],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "167" },
  },
  render(s) {
    const middle = pageHeader({ title: s.title, intro: s.intro }) + photoGrid((s.images || []).slice(0, 2), 2);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
