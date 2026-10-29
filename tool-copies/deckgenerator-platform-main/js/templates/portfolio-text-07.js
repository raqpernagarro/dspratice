// Template: portfolio/text-07 — a full-height photo on the left, a "Results"
// heading + a list of headline stats on the right. Source Figma frame 109:10401.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/text-07",
  slide: 89,
  figmaNode: "109:10401",
  family: "portfolio", role: "results", shape: "split", theme: "light", chrome: false,
  use: "A full-height photo on the left, a Results heading + headline stats on the right.",
  media: ["photo"],
  capacity: { items: 4, min: 1, max: 6 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 0, stats: 4, icons: 0 },
  description: "portfolio/text-07 — photo left, Results heading + stats right.",
  schema: {
    image: "string — photo path", title: "string",
    stats: "array of strings (headline results)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    image: "assets/photography/20200717-101621_Nagarro_802_edit.jpg",
    title: "Results",
    stats: ["200k followers", "27% increase in sales"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "184" },
  },
  render(s) {
    const rows = (s.stats || [])
      .map((t) => `<div class="v2f-pf-statrow"><span class="k">${esc(t)}</span><span class="p">+</span></div>`).join("");
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
        <div class="c between">
          <p class="v2f-pf-lead" style="font-size:36px;line-height:44px">${esc(s.title ?? "Results")}</p>
          <div class="v2f-pf-statlist">${rows}</div>
        </div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
