// Template: main/team-04 — "Team Composition": a role × month allocation table
// (role, location, monthly FTEs, run rate). Source Figma frame 342:40716.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const COLS = ["Role", "Location", "M1", "M2", "M3", "M4", "M5", "M6", "UAT/LIVE"];
const ROWS = [
  { role: "Senior Product Designer", loc: "Europe", m: ["1", "1", "1", "", "", ""], run: "" },
  { role: "Product Designer", loc: "Europe", m: ["1", "1", "1", "", "", ""], run: "" },
  { role: "Product Owner / BA", loc: "Offshore", m: ["1", "1", "1", "1", "1", "1"], run: "1" },
  { role: "Architect", loc: "Europe/Offshore", m: ["0.5", "0.5", "0.5", "0.5", "0.5", "0.5"], run: "0.5" },
  { role: "Senior Developer", loc: "Offshore", m: ["", "3", "4", "5", "5", "5"], run: "4" },
  { role: "QA Specialist", loc: "Offshore", m: ["", "1", "1", "1", "2", "2"], run: "1" },
  { role: "Scrum Master", loc: "Offshore", m: ["0.5", "0.5", "0.5", "0.5", "0.5", "0.5"], run: "0.5" },
  { role: "Project Manager", loc: "US", m: ["0.5", "0.5", "0.5", "0.5", "0.5", "0.5"], run: "0.5" },
];

export default {
  name: "main/team-04", slide: -5, figmaNode: "342:40716",
  family: "main", role: "team", shape: "table", theme: "light", chrome: false,
  use: "A team-composition table — role, location, monthly FTE allocation and run rate.",
  media: [], capacity: { items: 8, min: 3, max: 12 },
  slots: { images: 0, titles: 1, body: 8, stats: 0, icons: 0 },
  description: "main/team-04 — heading + role × month allocation table.",
  intent: { bestFor: ["team composition with roles, locations, FTE and cost"], holds: "3–12 roles as table rows", avoid: ["people introductions without staffing figures"], feel: "data", needs: [] },
  schema: {
    title: "string — heading", cols: "array of column headers",
    rows: "array of { role, loc, m:[…6], run }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Team Composition", cols: COLS, rows: ROWS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cols = s.cols || COLS;
    const rows = s.rows || ROWS;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-team4 reveal">
          ${s.title ? `<p class="ttl">${esc(s.title)}</p>` : ""}
          <div class="tbl">
            <div class="head">${cols.map((c) => `<span>${esc(c)}</span>`).join("")}</div>
            <div class="body">
              ${rows.map((r) => `<div class="row">
                <span class="role">${esc(r.role)}</span>
                <span class="loc">${esc(r.loc)}</span>
                ${(r.m || []).map((v) => `<span class="v">${esc(v)}</span>`).join("")}
                <span class="run">${esc(r.run || "")}</span>
              </div>`).join("")}
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
