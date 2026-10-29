// Template: main/split-04 — a cost-breakdown table: eyebrow + heading over a bottom-
// anchored 3-column table (Phase / Breakdown / Contract Value) with a highlighted total
// row. Source Figma frame 342:39910.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

const COLS = ["Phase", "Breakdown", "Contract Value"];
const ROWS = [
  { p: "Release (R1 + R2)", b: ["Development Cost", "Design & Requirements"], v: ["$270,160", "$148,768"] },
  { p: "Total cost 2026", b: [], v: ["$418,928"] },
  { p: "Build & Run 2027", b: ["Build (PI-1 + PI-2)", "Run (AMS)"], v: ["$269,360", "$67,600"] },
  { p: "Total cost 2027", b: [], v: ["$336,960"] },
  { p: "Run 2028 (AMS)", b: ["Run (AMS)"], v: ["$135,200"] },
  { p: "Total Sum NET (2026, 2027, 2028)", b: [], v: ["$891,088"], total: true },
];

export default {
  name: "main/split-04", slide: -29, figmaNode: "342:39910",
  family: "main", role: "content", shape: "table", theme: "light", chrome: false,
  use: "A cost-breakdown table — heading over a 3-column table (phase / breakdown / contract value) with a highlighted total.",
  media: [], capacity: { items: 8, min: 2, max: 12 },
  slots: { images: 0, titles: 1, body: 8, stats: 0, icons: 0 },
  description: "main/split-04 — eyebrow + heading + phase/contract-value table with total row.",
  schema: {
    caption: "string — eyebrow", title: "string — heading", cols: "array of 3 headers",
    rows: "array of { p, b:[…], v:[…], total? }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", cols: COLS, rows: ROWS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cols = s.cols || COLS;
    const rows = s.rows || ROWS;
    const lines = (arr) => (arr || []).map((x) => `<span>${esc(x)}</span>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tblwrap reveal">
          ${pageHeader({ caption: s.caption, title: s.title ?? "" })}
          <div class="v2f-mn-t4">
            <div class="head">${cols.map((c) => `<span>${esc(c)}</span>`).join("")}</div>
            <div class="body">
              ${rows.map((r) => `
                <div class="row${r.total ? " total" : ""}">
                  <span class="ph">${esc(r.p)}</span>
                  <div class="bd">${lines(r.b)}</div>
                  <div class="cv">${lines(r.v)}</div>
                </div>`).join("")}
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
