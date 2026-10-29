// Template: main/chart-02 (was main/logos-07: a chart, so renamed out of that series) — a growth line chart: pageHeader on the left, a dotted
// ascending line over week rows with two markers and a big growth figure bottom-right.
// Source Figma frame 342:40170.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"];

export default {
  name: "main/chart-02", slide: -22, figmaNode: "342:40170",
  family: "main", role: "chart", shape: "chart", theme: "light", chrome: false,
  use: "A growth line chart — heading on the left, a dotted ascending line across week rows with markers and a headline growth figure.",
  media: [], capacity: { items: 8, min: 4, max: 10 },
  slots: { images: 0, titles: 1, body: 1, stats: 1, icons: 0 },
  description: "main/chart-02 — heading left, dotted growth line + big growth figure right.",
  intent: { bestFor: ["growth across consecutive weeks or periods"], holds: "4–10 periods with a value each and a headline growth figure", avoid: ["flat or falling series", "categories that are not time"], feel: "data", needs: ["a value per period"] },
  schema: {
    caption: "string — eyebrow", title: "string — heading", intro: "string — intro paragraph",
    weeks: "array of row labels (act as the y-axis)",
    growth: "string — headline figure", growthLabel: "string — its label",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Trusted by global brands",
    intro: "We help our clients transform innovative ideas into inspiring brands, amazing products and cutting edge experiences that touch millions.",
    weeks: WEEKS, growth: "+132%", growthLabel: "Growth",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const weeks = s.weeks || WEEKS;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-lg7 reveal">
          <div class="side">
            ${pageHeader({ caption: s.caption, title: s.title ?? "", intro: s.intro })}
          </div>
          <div class="plot">
            <div class="weeks">${weeks.map((w) => `<span>${esc(w)}</span>`).join("")}</div>
            <div class="graph">
              <svg viewBox="0 0 1140 720" width="1140" height="720" aria-hidden="true">
                <polyline points="10,690 430,555 700,410 1130,320" fill="none"
                  stroke="var(--fill-petrol,#06041f)" stroke-width="3"
                  stroke-linecap="round" stroke-dasharray="0.1 11"/>
                <circle cx="430" cy="555" r="10" fill="#fff" stroke="var(--fill-petrol,#06041f)" stroke-width="3"/>
                <circle cx="700" cy="410" r="10" fill="#fff" stroke="var(--fill-petrol,#06041f)" stroke-width="2.5"/>
                <circle cx="700" cy="410" r="4.5" fill="var(--fill-petrol,#06041f)"/>
              </svg>
              ${s.growth ? `<div class="growth">
                ${s.growthLabel ? `<span class="lbl">${esc(s.growthLabel)}</span>` : ""}
                <span class="num">${esc(s.growth)}</span>
              </div>` : ""}
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
