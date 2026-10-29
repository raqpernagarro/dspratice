// Template: main/text-03 — a full-bleed photo with a large white two-line statement
// anchored lower-left over a subtle scrim. Source Figma frame 442:29547.
import { esc } from "../components.js";
import { topBar } from "../frame.js";

export default {
  name: "main/text-03", slide: -40, figmaNode: "442:29547",
  family: "main", role: "statement", shape: "single", theme: "dark", chrome: false,
  use: "A full-bleed photo statement with a longer, two-line white sentence.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/text-03 — full-bleed photo + two-line white statement, lower-left.",
  // Part of Nagarro's own company-introduction sequence (main/text-02…06), from
  // the previous slide library: used as-is, in order, with its own photos and
  // words. Generated content goes on main/photo-statement instead.
  intent: {
    bestFor: ["Nagarro's own company introduction, used as-is and in order (main/text-02 to text-06)"],
    holds: "the sequence's own fixed photos and words",
    avoid: ["any client, project or generated content — use main/photo-statement"],
    feel: "visual",
    needs: [],
  },
  schema: {
    title: "string — the statement", image: "photo URL",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "We co-created flight planning software to calculate 30,000+ flights daily",
    image: "assets/case-study/cockpit.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-dark">
        <div class="v2f-mn-tp-bg">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}<span class="scrim"></span></div>
        ${topBar(s.meta)}
        <div class="v2f-mn-tp reveal"><p class="stmt">${esc(s.title ?? "")}</p></div>
      </div>`;
  },
};
