// Template: main/grid-03 — a three-phase process comparison (e.g. Discover / Specify /
// Build). Each column: phase title + description, an "how it accelerates" bullet list,
// a row of tool chips, and a petrol "Transformation" stat callout anchored at the
// bottom. Source Figma frame (main/grid-03, section 342:43164).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const PHASES = [
  {
    phase: "Discover",
    desc: "Gather insights to reveal user needs and early opportunities while building shared cross-team understanding.",
    listTitle: "How AI Accelerates Discovery",
    bullets: ["Faster insight gathering", "Early opportunity detection", "Rapid alignment across teams"],
    toolsLabel: "AI tools to accelerate discovery",
    tools: 7,
    transform: "33/50% Time Reduction / Wider Scope",
  },
  {
    phase: "Specify",
    desc: "Explore and refine solutions quickly, validating feasibility and usability early to minimise downstream risk.",
    listTitle: "How AI Accelerates Definition",
    bullets: ["More solution exploration", "Prototypes in hours", "Early usability validation", "Technical architecture design"],
    toolsLabel: "AI tools to accelerate definition",
    tools: 6,
    transform: "33/50% Time Reduction / Risk mitigation",
  },
  {
    phase: "Build",
    desc: "Turn discovery into actionable, aligned requirements that guide engineering toward scalable delivery.",
    listTitle: "How AI Accelerates Building",
    bullets: ["Clearer specifications", "Faster documentation", "Fewer alignment loops", "Validation and testing"],
    toolsLabel: "AI tools to accelerate building",
    tools: 6,
    transform: "33/50% Faster Time to Market",
  },
];

export default {
  name: "main/grid-03", slide: -51, figmaNode: "342:37692",
  family: "main", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A three-phase process comparison with bullet benefits, tool chips, and stat callouts.",
  media: [], capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 0, titles: 1, body: 0, stats: 3, icons: 0 },
  description: "main/grid-03 — 3-column phase/process comparison + Transformation callouts.",
  schema: {
    title: "string — heading",
    phases: "array of { phase, desc, listTitle, bullets[], toolsLabel, tools(int), transform }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "New AI Assisted SDLC",
    phases: PHASES,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cols = (s.phases || PHASES).map((p) => {
      const bullets = (p.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("");
      const chips = Array.from({ length: p.tools || 0 }, () => `<span class="tchip"></span>`).join("");
      return `
        <div class="v2f-mn-grid3-col">
          <p class="phase">${esc(p.phase)}</p>
          <p class="desc">${esc(p.desc)}</p>
          <div class="block">
            <p class="btitle">${esc(p.listTitle)}</p>
            <ul>${bullets}</ul>
          </div>
          <div class="tools">
            <p class="tlabel">${esc(p.toolsLabel)}</p>
            <div class="chips">${chips}</div>
          </div>
          <div class="transform">
            <p class="tt">Transformation</p>
            <p class="ts">${esc(p.transform)}</p>
          </div>
        </div>`;
    }).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-grid3 reveal">
          <p class="v2f-mn-h">${esc(s.title ?? "")}</p>
          <div class="v2f-mn-grid3-cols">${cols}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
