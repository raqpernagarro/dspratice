// Template: planning/grid-06 — "Sprints": a left text column (with category chips)
// beside a sprint-by-week panel. Source Figma frame 105:2734.
import { footerBar, topBar } from "../frame.js";
import { esc } from "../components.js";
import { plSprintPanel } from "../planning-blocks.js";

export default {
  name: "planning/grid-06", slide: 162, figmaNode: "105:2734",
  family: "planning", role: "diagram", shape: "sprints", theme: "light", chrome: false,
  use: "A sprint plan: sprints grouped by week, each week carrying a phase, with iteration markers, explained by a left text column.",
  media: [], capacity: { items: 6, min: 2, max: 8 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "planning/grid-06 — left text column + a sprint/week phase panel.",
  schema: {
    caption: "string", title: "string", subtitle: "string",
    chips: "array of { label, active }", body: "array of paragraphs",
    groups: "array of { sprint, rows:[{week,phase}], iterations:[string] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Sprints", subtitle: "Subtitle",
    chips: [{ label: "Category", active: true }, { label: "Category" }],
    body: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."],
    groups: [
      { sprint: "Sprint N-1", rows: [{ week: "Week -2", phase: "Phase 1" }, { week: "Week -1", phase: "Phase 2" }], iterations: [] },
      { sprint: "Sprint N", rows: [{ week: "Week 1", phase: "Phase 2" }, { week: "Week 2", phase: "Phase 4" }, { week: "Week 3", phase: "Phase 5" }, { week: "Week 4", phase: "Phase 6" }], iterations: ["Iteration 1", "Iteration 2"] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "65" },
  },
  render(s) {
    const chips = (s.chips || []).map((c) => `<span class="v2f-pl-chip${c.active ? " active" : ""}">${esc(c.label ?? "")}</span>`).join("");
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    const left = `<div class="v2f-pl-sprintleft">
      ${topBar(s.meta, { logoOnly: true })}
      <div class="copy">
        <div class="head">
          ${s.caption ? `<p class="v2f-caption">${esc(s.caption)}</p>` : ""}
          ${s.title ? `<p class="v2f-title">${esc(s.title)}</p>` : ""}
          ${s.subtitle ? `<p class="v2f-subtitle">${esc(s.subtitle)}</p>` : ""}
        </div>
        ${chips ? `<div class="v2f-pl-chips">${chips}</div>` : ""}
        ${body ? `<div class="v2f-pl-sprintbody">${body}</div>` : ""}
      </div>
    </div>`;
    return `<div class="v2f-root">
      <div class="v2f-pl-sprintsplit reveal">${left}${plSprintPanel(s.groups || [])}</div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
