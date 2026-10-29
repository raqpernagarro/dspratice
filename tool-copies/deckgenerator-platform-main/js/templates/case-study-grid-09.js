// Template: case-study/grid-09 — a result over time with its story: a headline,
// an area chart on a dark card at the left, and a paragraph at the bottom-right.
// Source Figma frame 110:40294. (The Figma area is drawn inverted, filling above
// the line; this renders it under the line, as on grid-10.)
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { csHead, csAreaChart, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/grid-09", slide: 257, figmaNode: "110:40294",
  family: "case-study", role: "chart", shape: "split", theme: "light", chrome: false,
  use: "A headline, an area chart of one series over time, and a paragraph explaining it.",
  media: [], capacity: { items: 4, min: 3, max: 6 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "case-study/grid-09 — eyebrow + headline, area chart (left) + paragraph (bottom-right).",
  intent: {
    bestFor: ["one figure that grew (or fell) over a few periods, with a sentence or two on why"],
    holds: "an eyebrow, a short headline, one series of 3–6 points (period label + value), and a paragraph of up to about 250 characters",
    itemChars: 260,
    avoid: ["several series or categories to compare", "a trend with no explanation (use case-study/grid-10)"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string",
    chart: "{ label, points: array of 3–6 { label, value } } — value is a number",
    body: "string — the paragraph",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Results", title: "What achievements can you share?",
    chart: { label: "Customers", points: [
      { label: "Q320", value: 27 }, { label: "Q420", value: 124 },
      { label: "Q421", value: 375 }, { label: "Q422", value: 600 },
    ] },
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "22" },
    footer: CS_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption, title: s.title }, { maxWidth: 1200 })}
        <div class="v2f-cs-chartrow reveal">
          ${csAreaChart(s.chart)}
          ${s.body ? `<p class="para">${esc(s.body)}</p>` : ""}
        </div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
