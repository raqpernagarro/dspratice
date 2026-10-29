// Template: portfolio/grid-04 — CV/about layout (mirror of grid-03): a photo +
// "About" paragraph on the left, an "Experience" list on the right. Source Figma
// frame 109:10130.
import { esc } from "../components.js";
import { frame } from "../frame.js";

const expRows = (rows = []) =>
  `<div class="v2f-pf-rows">${rows.map((r) => `<div class="r"><span class="k">${esc(r.label ?? "")}</span><span class="y">${esc(r.year ?? "")}</span></div>`).join("")}</div>`;

export default {
  name: "portfolio/grid-04",
  slide: 71,
  figmaNode: "109:10130",
  family: "portfolio", role: "cv", shape: "split", theme: "light", chrome: false,
  use: "CV/about page: a photo + About paragraph on the left, an Experience list on the right.",
  media: ["photo"],
  capacity: { items: 8, min: 3, max: 8 },
  slots: { images: 1, titles: 2, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "portfolio/grid-04 — photo + About left, Experience right.",
  schema: {
    image: "string — photo path",
    about: "{ title, body }", experience: "{ title, rows[] { label, year } }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    image: "assets/photography/20200717-092339_Nagarro_499.jpg",
    about: {
      title: "About",
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    experience: {
      title: "Experience",
      rows: Array.from({ length: 8 }, () => ({ label: "Lorem ipsum", year: "Year" })),
    },
    meta: { studio: "Product Studio", name: "Presentation Name", page: "166" },
  },
  render(s) {
    const a = s.about || {}, e = s.experience || {};
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c">
          <div class="v2f-imgbox" style="flex:0 0 auto;width:431px;aspect-ratio:1/1;align-self:flex-start">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
          <div class="v2f-pf-blk">${a.title ? `<p class="h">${esc(a.title)}</p>` : ""}${a.body ? `<p>${esc(a.body)}</p>` : ""}</div>
        </div>
        <div class="c">
          <div class="v2f-pf-blk">${e.title ? `<p class="h">${esc(e.title)}</p>` : ""}${expRows(e.rows || [])}</div>
        </div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
