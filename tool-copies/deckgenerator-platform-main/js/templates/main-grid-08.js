// Template: main/grid-08 — a day-column workshop plan: eyebrow + heading over 5 dashed
// "Day" columns, with stacked step cards (some mint-highlighted, spanning days).
// Source Figma frame 342:39749.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

const DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];
// l/w = % of full width (5 cols = 20% each); top/h in px.
const CARDS = [
  { t: "Project Context", d: "Understand and define project vision and main goals.", l: 0, w: 15.4, top: 56, h: 144 },
  { t: "Persona Mapping", d: "Define the main tasks target audience wants to get done.", l: 0, w: 15.4, top: 216, h: 144 },
  { t: "Jobs to be Done", d: "Define the main tasks target audience wants to get done.", l: 0, w: 15.4, top: 376, h: 144 },
  { t: "Customer Journey Mapping", d: "For the jobs identified develop a customer journey map to identify touch-points, challenges and opportunities.", l: 20, w: 15.4, top: 56, h: 224 },
  { t: "Workflow Mapping", d: "Diagraming workflows of how work gets done from troubleshooting point of view.", l: 20, w: 15.4, top: 296, h: 168 },
  { t: "Stakeholder Interviews", d: "One to one or group conversations where we explore and discuss needs, challenges and overall requirements.", l: 40, w: 15.4, top: 56, h: 248 },
  { t: "Information Analysis", d: "Gather and analyse generated information to document in Product Requirements Document.", l: 60, w: 35.4, top: 56, h: 120, mint: true },
  { t: "MVP Feature Mapping", d: "Taking most priority features and creating user story mapping to define the scope of the MVP backlog.", l: 60, w: 35.4, top: 192, h: 144, mint: true },
];

export default {
  name: "main/grid-08", slide: -32, figmaNode: "342:39749",
  family: "main", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A day-column workshop plan — a heading over dashed 'Day' columns with stacked step cards, some mint-highlighted.",
  media: [], capacity: { items: 8, min: 4, max: 12 },
  slots: { images: 0, titles: 1, body: 8, stats: 0, icons: 0 },
  description: "main/grid-08 — eyebrow + heading + 5 day-columns of step cards.",
  schema: {
    caption: "string — eyebrow", title: "string — heading",
    days: "array of column labels",
    cards: "array of { t, d, l, w, top, h, mint? }  (l/w % of width; top/h px)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Proposed Approach", title: "MVP Kick-Off Timeline",
    days: DAYS, cards: CARDS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const days = s.days || DAYS;
    const cards = s.cards || CARDS;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-g8 reveal">
          ${pageHeader({ caption: s.caption, title: s.title ?? "" })}
          <div class="v2f-mn-g8-frame">
            <div class="cols">
              ${days.map((d) => `<div class="day"><span>${esc(d)}</span></div>`).join("")}
            </div>
            <div class="cards">
              ${cards.map((c) => `<span class="card${c.mint ? " mint" : ""}" style="left:${c.l}%;width:${c.w}%;top:${c.top}px;height:${c.h}px;">
                <span class="t">${esc(c.t)}</span>
                ${c.d ? `<span class="d">${esc(c.d)}</span>` : ""}
              </span>`).join("")}
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
