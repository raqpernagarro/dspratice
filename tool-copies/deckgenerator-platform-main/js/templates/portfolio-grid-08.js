// Template: portfolio/grid-08 — a visual table of contents: a numbered project
// list on the left, a 4-column grid of project thumbnails on the right. Source
// Figma frame 109:10240.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { SAMPLE } from "../blocks.js";

export default {
  name: "portfolio/grid-08",
  slide: 78,
  figmaNode: "109:10240",
  family: "portfolio", role: "index", shape: "grid", count: 12, theme: "light", chrome: false,
  use: "A visual table of contents: a numbered project list beside a grid of project thumbnails.",
  media: ["photo"],
  capacity: { items: 12, min: 4, max: 12 },
  slots: { images: 12, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "portfolio/grid-08 — numbered project list + thumbnail grid.",
  schema: {
    caption: "string", title: "string",
    projects: "array of up to 12 { page, label, image }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Subtitle", title: "Table of contents",
    projects: Array.from({ length: 12 }, (_, i) => ({
      page: String([1, 4, 7, 11, 15, 21, 24, 29, 32, 37, 40, 42][i] ?? ""),
      label: `Project ${i + 1}`,
      image: SAMPLE[i % SAMPLE.length],
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "173" },
  },
  render(s) {
    const list = (s.projects || [])
      .map((p) => `<div class="row"><span class="pg">${esc(p.page ?? "")}</span><span class="lbl">${esc(p.label ?? "")}</span></div>`)
      .join("");
    const thumbs = (s.projects || [])
      .map((p) => `<div class="v2f-pf-thumb"><div class="box">${p.image ? `<img src="${esc(p.image)}" alt="">` : ""}</div><p class="cap">${esc(p.label ?? "")}</p></div>`)
      .join("");
    const middle = `
      <div class="v2f-pf-vtoc reveal">
        <div class="list">
          <div class="v2f-heading" style="width:auto;padding:0 0 24px">
            ${s.caption ? `<p class="v2f-caption">${esc(s.caption)}</p>` : ""}
            ${s.title ? `<p class="v2f-toc-title">${esc(s.title)}</p>` : ""}
          </div>
          ${list}
        </div>
        <div class="thumbs">${thumbs}</div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
