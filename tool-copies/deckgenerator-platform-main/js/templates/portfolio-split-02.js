// Template: portfolio/split-02 — a small project header (title, year / client)
// above a large full-width photo. Source Figma frame 109:10384.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/split-02",
  slide: 87,
  figmaNode: "109:10384",
  family: "portfolio", role: "showcase", shape: "single", theme: "light", chrome: false,
  use: "A small project header above a large full-width photo.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "portfolio/split-02 — small header + large photo.",
  schema: {
    title: "string", client: "string", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Project, 2026", client: "Client",
    image: "assets/photography/20200717-101120_Nagarro_764.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "182" },
  },
  render(s) {
    const middle = `
      <div class="v2f-pf-phead sm" style="flex:0 0 auto">
        ${s.title ? `<p class="t">${esc(s.title)}</p>` : ""}
        ${s.client ? `<p class="cl">${esc(s.client)}</p>` : ""}
      </div>
      <div class="v2f-imgbox reveal" style="flex:1 1 0;min-height:0">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
