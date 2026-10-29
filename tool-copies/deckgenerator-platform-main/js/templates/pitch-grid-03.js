// Template: pitch/grid-03 — a headline over 4 tinted metric cards, each a figure with its sentence.
// Source Figma frame 110:37036.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptTocItem, ptMetricCard, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-03", slide: 269, figmaNode: "110:37036",
  family: "pitch", role: "results", shape: "row", theme: "light", chrome: false,
  use: "A headline over 4 tinted metric cards: a figure in white with its sentence in muted white.",
  media: [], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 4, icons: 0 },
  description: "pitch/grid-03 — headline + 4 tinted metric cards.",
  intent: {
    bestFor: ["the size of the problem in numbers: how many users, how often, how much", "evidence that backs a claim, in 4 figures"],
    holds: "an eyebrow, a headline of up to about 90 characters, and exactly 4 metrics of a figure (up to 6 characters) and a sentence of up to about 70 characters",
    itemChars: 70,
    avoid: ["more or fewer than 4 figures", "figures that need a chart", "long explanations"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string",
    metrics: "array of 4 { value, text, tone } — tone is t25 | t50 | t75 | t100 (optional)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Problem", title: "Clearly describe the problem or pain point that your target market is facing.",
    metrics: [
      { value: "75%", text: "of users find current tools too complex to use effectively." },
      { value: "50%", text: "experience frequent downtimes, disrupting daily operations." },
      { value: "70%", text: "of businesses feel their software doesn’t scale with their needs." },
      { value: "60%", text: "of employees waste time switching between incompatible platforms." },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "09" },
    footer: PT_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${ptHead({ caption: s.caption, title: s.title }, { size: "h2", maxWidth: 900 })}
        <div class="v2f-pt-mcs reveal">${(s.metrics || []).slice(0, 4).map((m, i) => ptMetricCard(m, i)).join("")}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
