// Template: pitch/grid-12 — financial projections: groups of assumptions at the left, a bar chart
// of one projected figure on a tinted card at the right.
// Source Figma frame 110:37204.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-12", slide: 286, figmaNode: "110:37204",
  family: "pitch", role: "chart", shape: "split", theme: "light", chrome: false,
  use: "A heading with up to three groups of assumptions, beside a bar chart of one projected figure.",
  media: [], capacity: { items: 4, min: 3, max: 5 },
  slots: { images: 0, titles: 4, subtitles: 0, body: 3, stats: 4, icons: 0 },
  description: "pitch/grid-12 — heading + assumption lists, bar chart of one figure.",
  intent: {
    bestFor: ["financial projections: the assumptions behind them and the figure they produce, year by year"],
    holds: "an eyebrow, a title, up to three assumption groups of a name and 2–4 short lines, and 3–5 bars of a period and a value",
    itemChars: 40,
    avoid: ["more than five bars", "several series", "assumptions that need paragraphs"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string",
    groups: "array of up to 3 { title, items: string[] }",
    chart: "{ legend, bars: array of 3–5 { label, value, display } } — value is a number, display the text inside the bar",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Business", title: "Financial projections",
    groups: [
      { title: "Marketing", items: ["Website visitors: 150,000", "Sign-ups: 30,000", "Conversion rate: 20%"] },
      { title: "Product", items: ["Activation rate: 10%", "Week 1 rotation rate: 25%"] },
      { title: "Revenue", items: ["Conversion rate: 30%", "Week 1 retention rate: 15%", "Customer lifetime: 12 month", "Churn rate: 60%"] },
    ],
    chart: { legend: "Projected ARR", bars: [{ label: "2027", value: 10, display: "$10M" }, { label: "2030", value: 30, display: "$30M" }, { label: "2035", value: 100, display: "$100M" }, { label: "2040", value: 220, display: "$220M" }] },
    meta: { studio: "Product Studio", name: "Presentation Name", page: "26" },
    footer: PT_FOOTER,
  },
  render(s) {
    const gs = (s.groups || []).slice(0, 3).map((g) => `<div><h4>${esc(g.title ?? "")}</h4><ul>${(g.items || []).map((it) => `<li>${esc(it)}</li>`).join("")}</ul></div>`).join("");
    const left = ptCol(s.meta, `${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}<div class="v2f-pt-blocks">${gs}</div>`, { width: 597, logoOnly: true });
    const bars = (s.chart?.bars || []).slice(0, 5);
    const max = Math.max(1, ...bars.map((b) => Number(b.value) || 0));
    const H = 620;
    const chart = `
      <div class="v2f-pt-chartcard">
        <div class="v2f-pt-leg"><i></i>${esc(s.chart?.legend ?? "")}</div>
        <div class="v2f-pt-bars">${bars.map((b) => `<div class="bar" style="height:${Math.max(32, Math.round(((Number(b.value) || 0) / max) * H))}px">${esc(b.display ?? b.value ?? "")}</div>`).join("")}</div>
        <div class="v2f-pt-axis">${bars.map((b) => `<span>${esc(b.label ?? "")}</span>`).join("")}</div>
      </div>`;
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:24px;">${left}${chart}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
