// Template: portfolio/grid-22 — a "Press" heading + a list of press mentions on
// the left, a full-height photo on the right. Source Figma frame 109:10741.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/grid-22",
  slide: 113,
  figmaNode: "109:10741",
  family: "portfolio", role: "press", shape: "split", theme: "light", chrome: false,
  use: "A heading + a list of press mentions on the left, a full-height photo on the right.",
  media: ["photo"],
  capacity: { items: 4, min: 1, max: 8 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 4, stats: 0, icons: 0 },
  description: "portfolio/grid-22 — Press heading + mentions left, photo right.",
  schema: {
    title: "string", press: "array of { label, detail }", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Press",
    press: [
      { label: "Cover Feature", detail: "Lorem ipsum, January 2020" },
      { label: "Podcast Episode", detail: "Lorem ipsum, November 2019" },
      { label: "Feature", detail: "Lorem ipsum, December 2018" },
      { label: "Interview", detail: "Lorem ipsum, June 2018" },
    ],
    image: "assets/photography/20200717-091142_Nagarro_415.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "208" },
  },
  render(s) {
    const list = (s.press || [])
      .map((p) => `<p><b>${esc(p.label ?? "")}</b>, ${esc(p.detail ?? "")}</p>`).join("");
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c between">
          <p class="v2f-pf-lead" style="font-size:36px;line-height:44px">${esc(s.title ?? "Press")}</p>
          <div class="v2f-pf-press">${list}</div>
        </div>
        <div class="photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
