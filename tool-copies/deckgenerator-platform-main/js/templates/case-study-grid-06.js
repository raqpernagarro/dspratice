// Template: case-study/grid-06 — a twelve-month plan: three columns of four month
// cards, months already done in navy and the rest in grey, with an optional
// "Today" tag. Source Figma frame 110:40215.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { csHead, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/grid-06", slide: 247, figmaNode: "110:40215",
  family: "case-study", role: "timeline", shape: "calendar", theme: "light", chrome: false,
  use: "A twelve-month plan: month cards in three columns, done months in navy, upcoming in grey, a Today tag.",
  media: [], capacity: { items: 12, min: 12, max: 12 },
  slots: { images: 0, titles: 0, body: 0, stats: 0, icons: 0, list: 12 },
  description: "case-study/grid-06 — eyebrow over a 3×4 grid of month cards, done vs upcoming.",
  intent: {
    bestFor: ["a year of the project month by month", "what was delivered in each month, and where things stand today"],
    holds: "an eyebrow and exactly twelve month cards, each a month name and a label of 1–3 words",
    itemChars: 24,
    avoid: ["anything that is not a monthly plan", "descriptions longer than a few words", "fewer or more than twelve periods"],
    feel: "data",
    needs: ["what happened or is planned in each month"],
  },
  schema: {
    caption: "string",
    months: "array of 12 { month, label, done: boolean, today?: boolean } — filled column by column",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Process",
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      .map((month, i) => ({ month, label: "Services", done: i < 4, today: i === 3 })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "13" },
    footer: CS_FOOTER,
  },
  render(s) {
    const card = (m) => `
      <div class="v2f-cs-mcard${m.done ? "" : " is-next"}">
        ${m.today ? `<span class="today">Today</span>` : ""}
        <span class="m">${esc(m.month)}</span><span class="l">${esc(m.label)}</span>
      </div>`;
    const months = (s.months || []).slice(0, 12);
    const cols = [0, 1, 2].map((c) => `<div class="v2f-cs-mcol">${months.slice(c * 4, c * 4 + 4).map(card).join("")}</div>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption })}
        <div class="v2f-cs-mgrid reveal">${cols}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
