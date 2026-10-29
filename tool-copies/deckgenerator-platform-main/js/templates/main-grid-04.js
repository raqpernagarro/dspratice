// Template: main/grid-04 — a single-phase deep dive: heading + intro, a two-column
// breakdown (traditional challenges + tool rows | how AI accelerates + impact rows),
// and a full-width petrol "Transformation" callout. Source Figma frame (main/grid-04,
// section 342:43164).
import { esc } from "../components.js";
import { icon } from "../icons.js";
import { topBar, footerBar } from "../frame.js";

const EX = {
  title: "Discover",
  intro: "Gather insights to reveal user needs and early opportunities while building shared cross-team understanding.",
  leftTitle: "Traditional Challenges",
  challenges: [
    "Research synthesis slow (weeks → months)",
    "Insights scattered across documents and teams",
    "Difficult to validate assumptions early",
    "Competitive/market scans take too long",
  ],
  toolsTitle: "Top tools that we use to accelerate",
  toolRows: [
    { tools: 3, text: "FigJam, Miro, JIRA Product Discovery" },
    { tools: 3, text: "Perplexity, ChatGPT, Claude" },
    { tools: 2, text: "Dovetail, Notion AI, Synthetic Personas" },
  ],
  rightTitle: "How AI Accelerates Discovery",
  accelerates: [
    "Summarizes interviews, documents, market data in minutes",
    "Clusters insights and identifies patterns early",
    "Creates draft personas, journeys, and thematic maps",
    "Enables rapid exploration of opportunity spaces",
  ],
  impactTitle: "Impact and Benefits",
  impacts: [
    { icon: "downward-graph", text: "Discovery reduced from ±3 months → ~1, with deeper coverage" },
    { icon: "forward", text: "20–30% faster synthesis of research artifacts" },
    { icon: "group-of-people", text: "2× faster alignment across teams" },
  ],
  transformStat: "33/50% Reduction",
  transformText: "Summarizing 10–15 interviews took a week; now an AI draft arrives in 30 minutes and is refined in hours.\nFaster research synthesis → earlier insight patterns → reduced ambiguity",
};

export default {
  name: "main/grid-04", slide: -50, figmaNode: "342:37728",
  family: "main", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A single-phase deep dive: challenges vs. AI acceleration, tool rows, impact stats, and a Transformation callout.",
  media: ["icon"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 4, stats: 3, icons: 3 },
  description: "main/grid-04 — phase deep-dive (2-col + Transformation callout).",
  schema: {
    title: "string", intro: "string",
    leftTitle: "string", challenges: "array of strings",
    toolsTitle: "string", toolRows: "array of { tools(int), text }",
    rightTitle: "string", accelerates: "array of strings",
    impactTitle: "string", impacts: "array of { icon, text }",
    transformStat: "string", transformText: "string (\\n = new line)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: { ...EX, meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const d = { ...EX, ...s };
    const li = (arr) => (arr || []).map((b) => `<li>${esc(b)}</li>`).join("");
    const toolRows = (d.toolRows || []).map((r) => `
      <div class="v2f-mn-grid4-row">
        <span class="cluster">${Array.from({ length: r.tools || 0 }, () => `<span class="tchip"></span>`).join("")}</span>
        <span class="txt">${esc(r.text)}</span>
      </div>`).join("");
    const impacts = (d.impacts || []).map((r) => `
      <div class="v2f-mn-grid4-row">
        <span class="ic">${icon(r.icon)}</span>
        <span class="txt">${esc(r.text)}</span>
      </div>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-grid4 reveal">
          <p class="v2f-mn-h">${esc(d.title)}</p>
          <p class="v2f-mn-grid4-intro">${esc(d.intro)}</p>
          <div class="v2f-mn-grid4-cols">
            <div class="v2f-mn-grid4-col">
              <div class="block"><p class="btitle">${esc(d.leftTitle)}</p><ul>${li(d.challenges)}</ul></div>
              <div class="block"><p class="btitle">${esc(d.toolsTitle)}</p><div class="v2f-mn-grid4-rows">${toolRows}</div></div>
            </div>
            <div class="v2f-mn-grid4-col">
              <div class="block"><p class="btitle">${esc(d.rightTitle)}</p><ul>${li(d.accelerates)}</ul></div>
              <div class="block"><p class="btitle">${esc(d.impactTitle)}</p><div class="v2f-mn-grid4-rows">${impacts}</div></div>
            </div>
          </div>
          <div class="v2f-mn-grid4-transform">
            <span class="spark">${icon("sparkle")}</span>
            <span class="badge"><span class="tl">Transformation</span><span class="ts">${esc(d.transformStat)}</span></span>
            <span class="desc">${esc(d.transformText)}</span>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
