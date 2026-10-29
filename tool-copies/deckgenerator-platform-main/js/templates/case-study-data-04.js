// Template: case-study/data-04 — the results in three numbers: a headline, then
// three dark stat cards, each a label and a large figure with a trend arrow.
// Source Figma frame 110:40287.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { csHead, csFooter, CS_FOOTER } from "../case-study-blocks.js";

const ARROW = (dir) => dir === "none" ? "" :
  `<svg class="${dir === "down" ? "down" : ""}" viewBox="0 0 38.97 33.75" aria-hidden="true"><path d="M19.49 0L38.97 33.75H0Z" fill="#fff" opacity=".5"/></svg>`;

export default {
  name: "case-study/data-04", slide: 256, figmaNode: "110:40287",
  family: "case-study", role: "results", shape: "row", theme: "light", chrome: false,
  use: "A headline over three dark stat cards: a label and one large figure each, with a trend arrow.",
  media: [], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 0, titles: 1, body: 0, stats: 3, icons: 0 },
  description: "case-study/data-04 — eyebrow + headline, three dark stat cards (label, ▲ value).",
  intent: {
    bestFor: ["the results of a project as three headline numbers: growth, adoption, savings",
      "three KPIs that moved, each with its own label"],
    holds: "an eyebrow, a short headline, then exactly three stats of a one- or two-word label and a value of up to about 6 characters (20%, 587, 4.7K)",
    itemChars: 24,
    avoid: ["numbers that need a sentence to explain them", "more or fewer than three figures", "a trend over time (use case-study/grid-10)"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string",
    stats: "array of 3 { label, value, trend: 'up' | 'down' | 'none' }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Results", title: "What did you accomplish?",
    stats: [
      { label: "Customers", value: "20%", trend: "up" },
      { label: "Downloads", value: "587", trend: "up" },
      { label: "Registrations", value: "4.7K", trend: "up" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "21" },
    footer: CS_FOOTER,
  },
  render(s) {
    const stats = (s.stats || []).slice(0, 3).map((st) => `
      <div class="v2f-cs-stat">
        <p class="k">${esc(st.label ?? "")}</p>
        <div class="v">${ARROW(st.trend ?? "up")}<p>${esc(st.value ?? "")}</p></div>
      </div>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption, title: s.title }, { maxWidth: 1200 })}
        <div class="v2f-cs-stats reveal">${stats}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
