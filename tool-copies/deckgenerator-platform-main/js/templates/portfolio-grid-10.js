// Template: portfolio/grid-10 — an "Idea" heading + paragraph on the left, a
// two-column collage of photos on the right. Source Figma frame 109:10327.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { staggerWall, SAMPLE } from "../blocks.js";

export default {
  name: "portfolio/grid-10",
  slide: 84,
  figmaNode: "109:10327",
  family: "portfolio", role: "text", shape: "split", theme: "light", chrome: false,
  use: "A heading + paragraph on the left, a two-column photo collage on the right.",
  media: ["photo"],
  capacity: { items: 6, min: 2, max: 6 },
  slots: { images: 6, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "portfolio/grid-10 — heading + paragraph left, photo collage right.",
  schema: {
    title: "string", body: "string", images: "array of photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Idea",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: SAMPLE.slice(6, 12),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "179" },
  },
  render(s) {
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c between">
          <p class="v2f-pf-lead">${esc(s.title ?? "")}</p>
          <div class="v2f-pf-blk">${s.body ? `<p>${esc(s.body)}</p>` : ""}</div>
        </div>
        <div class="c">${staggerWall((s.images || []).slice(0, 6), { cols: 2, aspect: "442 / 588", offsets: [80, -120] })}</div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
