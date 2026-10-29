// Template: portfolio/grid-20 — a "Recognition" heading above a list of awards
// (label + year). Source Figma frame 109:10711.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/grid-20",
  slide: 111,
  figmaNode: "109:10711",
  family: "portfolio", role: "index", shape: "list", theme: "light", chrome: false,
  use: "A heading above a list of awards / recognitions with years.",
  media: [],
  capacity: { items: 10, min: 3, max: 12 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/grid-20 — Recognition heading + label/year list.",
  schema: {
    title: "string", items: "array of { label, year }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Recognition",
    items: [
      { label: "Lorem ipsum", year: "2016" }, { label: "Lorem ipsum", year: "2018" },
      { label: "Lorem ipsum", year: "2019" }, { label: "Lorem ipsum", year: "2020" },
      { label: "Lorem ipsum", year: "2021" }, { label: "Lorem ipsum", year: "2021" },
      { label: "Lorem ipsum", year: "2021" }, { label: "Lorem ipsum", year: "2022" },
      { label: "Lorem ipsum", year: "2024" }, { label: "Lorem ipsum", year: "2024" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "206" },
  },
  render(s) {
    const rows = (s.items || [])
      .map((it) => `<div class="v2f-pf-indexrow"><span class="lbl">${esc(it.label ?? "")}</span><span class="pg">${esc(it.year ?? "")}</span></div>`)
      .join("");
    const middle = `
      <p class="v2f-pf-sechead">${esc(s.title ?? "Recognition")}</p>
      <div class="v2f-pf-index reveal" style="padding-top:0">${rows}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
