// Template: case-study/data-03 — the project stages as a timeline: a row of
// pill-shaped stages sized by duration (done in navy, upcoming in grey), month
// labels above and a "Today" marker below. Source Figma frame 110:40201.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { csHead, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/data-03", slide: 246, figmaNode: "110:40201",
  family: "case-study", role: "timeline", shape: "timeline", theme: "light", chrome: false,
  use: "The project's stages on a timeline: pills sized by duration, months above, a Today marker below.",
  media: [], capacity: { items: 5, min: 3, max: 6 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0, list: 5 },
  description: "case-study/data-03 — headline over a pill timeline of stages, months above, Today below.",
  intent: {
    bestFor: ["the stages of the project in order, with how long each took",
      "where the project stands today against its plan"],
    holds: "an eyebrow and a headline, then 3–6 stage names of one or two words, each with a relative length; month labels and a Today marker",
    itemChars: 18,
    avoid: ["stages that need a description", "more than six stages", "a plan with no time dimension"],
    feel: "data",
    needs: ["the stages and roughly how long each took"],
  },
  schema: {
    caption: "string", title: "string",
    stages: "array of 3–6 { label, weight (relative length), done: boolean }",
    months: "array of { label, at (0–1 across the bar) }", today: "number 0–1 across the bar, or omit",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Process", title: "Highlight the project stages.",
    stages: [
      { label: "Services", weight: 595, done: true },
      { label: "Ideation", weight: 160, done: true },
      { label: "Proposal", weight: 160, done: true },
      { label: "Prototyping", weight: 440, done: true },
      { label: "Implementation", weight: 461, done: false },
    ],
    months: [{ label: "January", at: 0 }, { label: "February", at: 0.327 }, { label: "March", at: 0.506 }, { label: "April", at: 0.748 }],
    today: 0.626,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "12" },
    footer: CS_FOOTER,
  },
  render(s) {
    const pct = (x) => `${Math.max(0, Math.min(1, Number(x) || 0)) * 100}%`;
    const pills = (s.stages || []).slice(0, 6).map((st) =>
      `<div class="v2f-cs-pill${st.done === false ? " is-next" : ""}" style="flex:${Number(st.weight) || 1} 1 0;">${esc(st.label)}</div>`).join("");
    const months = (s.months || []).map((m) => `<span style="left:${pct(m.at)};">${esc(m.label)}</span>`).join("");
    const today = s.today != null ? `<div class="v2f-cs-tl-marks today"><span style="left:${pct(s.today)};">Today</span></div>` : "";
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption, title: s.title })}
        <div class="v2f-cs-tl reveal">
          <div class="v2f-cs-tl-marks months">${months}</div>
          <div class="v2f-cs-tl-bar">${pills}</div>
          ${today}
        </div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
