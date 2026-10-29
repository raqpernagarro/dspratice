// Template: portfolio/grid-03 — CV/about layout: a full-height photo on the left,
// an "About" paragraph and an "Experience" list (label + year) on the right.
// Source Figma frame 109:10094.
import { esc } from "../components.js";
import { frame } from "../frame.js";

const expRows = (rows = []) =>
  `<div class="v2f-pf-rows">${rows.map((r) => `<div class="r"><span class="k">${esc(r.label ?? "")}</span><span class="y">${esc(r.year ?? "")}</span></div>`).join("")}</div>`;

export default {
  name: "portfolio/grid-03",
  slide: 70,
  figmaNode: "109:10094",
  family: "portfolio", role: "cv", shape: "split", theme: "light", chrome: false,
  use: "CV/about page: a full-height photo on the left, an About paragraph and an Experience list on the right.",
  media: ["photo"],
  capacity: { items: 8, min: 3, max: 8 },
  slots: { images: 1, titles: 2, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "portfolio/grid-03 — photo left, About + Experience right.",
  schema: {
    image: "string — photo path",
    about: "{ title, body }", experience: "{ title, rows[] { label, year } }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    image: "assets/photography/20200717-091737_Nagarro_464.jpg",
    about: {
      title: "About",
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    experience: {
      title: "Experience",
      rows: Array.from({ length: 6 }, () => ({ label: "Lorem ipsum", year: "Year" })),
    },
    meta: { studio: "Product Studio", name: "Presentation Name", page: "165" },
  },
  render(s) {
    const a = s.about || {}, e = s.experience || {};
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
        <div class="c">
          <div class="v2f-pf-blk">${a.title ? `<p class="h">${esc(a.title)}</p>` : ""}${a.body ? `<p>${esc(a.body)}</p>` : ""}</div>
          <div class="v2f-pf-blk">${e.title ? `<p class="h">${esc(e.title)}</p>` : ""}${expRows(e.rows || [])}</div>
        </div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
