// Template: portfolio/text-05 — an "Idea" heading top-left with a paragraph
// pinned bottom-left, beside a full-height photo on the right. Source Figma frame
// 109:10321.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/text-05",
  slide: 83,
  figmaNode: "109:10321",
  family: "portfolio", role: "text", shape: "split", theme: "light", chrome: false,
  use: "A heading top-left + paragraph bottom-left, beside a full-height photo.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "portfolio/text-05 — heading + paragraph left, photo right.",
  schema: {
    title: "string", body: "string", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Idea",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    image: "assets/photography/20200717-100402_Nagarro_684.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "178" },
  },
  render(s) {
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c between">
          <p class="v2f-pf-lead">${esc(s.title ?? "")}</p>
          <div class="v2f-pf-blk">${s.body ? `<p>${esc(s.body)}</p>` : ""}</div>
        </div>
        <div class="photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
