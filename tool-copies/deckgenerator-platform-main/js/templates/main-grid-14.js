// Template: main/grid-14 — the signature Nagarro "process spine": three phase headers over
// a mint journey line that runs straight, tangles (discovery), converges (a design-sprint
// lens) and waves (delivery) across eight labelled stages, under a dotted continuous-
// validation bracket. Source Figma frame 342:40393.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

// Eight stages, positioned by the x of their text column (exact Figma coords).
const COLS = [
  { x: 40, mid: "Business\nDiscovery", head: "Discovery\nworkshops",
    items: ["Business objectives", "Initial Analysis & Foundational Workshops"] },
  { x: 280, mid: "Definition\n& Ideation", head: "Opportunities\nmapping",
    items: ["Market research", "Product analysis", "Service analysis"] },
  { x: 550, mid: "Product Roadmap\n& Release Plan", head: "Product\nstrategy",
    items: ["Product lean canvas", "Story mapping", "Product teams sync", "Client alignment", "Product backlog"] },
  { x: 803, mid: "Design\nSprints", head: "Usability\n& viability",
    items: ["UI concepts", "User flow mapping", "Customer journeys", "Client alignment"] },
  { x: 1060, mid: "", head: "Prototyping\n& validation",
    items: ["Usability testing", "User testing", "Risk mitigation", "Validated user stories"] },
  { x: 1274, mid: "Sprint\nBacklog", head: "Feature\npriorities",
    items: ["Product strategy prioritization", "Definition of ready and done"] },
  { x: 1497, mid: "Agile\nDevelopment", head: "Design\n& development",
    items: ["Development ready design", "Coding and Testing"] },
  { x: 1716, mid: "Post-release\nKPI metrics", head: "Release, measure,\nlearn, iterate",
    items: ["Feature release", "Customer feedback loop", "New insights"] },
];
const PHASES = [
  { x: 40, w: 180, t: "Align with\nBusiness Strategy" },
  { x: 563, w: 180, t: "Product\nDiscovery" },
  { x: 1287, w: 180, t: "Product\nDelivery" },
];
const DIVIDERS = [256, 526, 779, 1250, 1473, 1692];
const BRACKET_LABEL = "Continuous business strategy validation";
const TITLE = "Product operating\nmodel";
const INTRO = "Our operating model spans strategy, discovery, delivery, and continuous improvement. AI acts as a value amplifier.";
const SY = 617; // spine baseline as drawn; placed at y=674 by SPINE below
/* Figma 342:40393 (2026-10-15) added a PageHeader and fitted the diagram into
   y=324–964: phases 324, bracket 395, stage labels 494, spine 674, columns
   797. The spine paths keep their original coordinates and are moved as one. */
const SPINE = "translate(82 674) scale(1.0117 1) translate(-82 -617)";

export default {
  name: "main/grid-14", slide: -16, figmaNode: "342:40393",
  family: "main", role: "content", shape: "diagram", theme: "light", chrome: false,
  use: "The signature process spine — a mint journey line that runs, tangles, converges and waves across eight labelled delivery stages under a continuous-validation bracket.",
  media: [], capacity: { items: 8, min: 6, max: 8 },
  slots: { images: 0, titles: 3, body: 8, stats: 0, icons: 0 },
  description: "main/grid-14 — three-phase process spine across eight stages.",
  schema: {
    title: "string — the slide title", intro: "string — the paragraph beside it",
    phases: "array of { x, w, t } — phase headers",
    cols: "array of { x, mid, head, items[] } — the eight stage columns",
    bracketLabel: "string — the dotted-bracket caption",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: TITLE, intro: INTRO, phases: PHASES, cols: COLS, bracketLabel: BRACKET_LABEL,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cols = s.cols || COLS;
    const phases = s.phases || PHASES;
    const dividers = s.dividers || DIVIDERS;
    const M = "var(--mint-green,#47d7ac)";
    const G = "var(--navy-300,#c4c9d2)";

    const svg = `<svg class="g14-svg" viewBox="0 0 1920 1080" width="1920" height="1080" aria-hidden="true">
      <!-- column dividers -->
      ${dividers.map((x) => `<line x1="${x}" y1="500" x2="${x}" y2="964" stroke="rgba(1,7,22,.12)" stroke-width="1"/>`).join("")}

      <!-- dotted validation bracket -->
      <path d="M84 476 L84 403 Q84 395 92 395 L1790 395 Q1798 395 1798 403 L1798 476"
        fill="none" stroke="${G}" stroke-width="1.5" stroke-dasharray="2 7" stroke-linecap="round"/>

      <!-- col1 dropper (down-arrow into spine) -->
      <line x1="84" y1="548" x2="84" y2="646" stroke="${G}" stroke-width="1.5" stroke-dasharray="2 7" stroke-linecap="round"/>
      <polygon points="84,658 76,644 92,644" fill="${G}"/>
      <!-- col8 dropper (ends in a dot) -->
      <line x1="1798" y1="548" x2="1798" y2="636" stroke="${G}" stroke-width="1.5" stroke-dasharray="2 7" stroke-linecap="round"/>
      <circle cx="1798" cy="646" r="6" fill="var(--navy-500,#8893a5)"/>

      <!-- ==== the mint spine ==== -->
      <g transform="${SPINE}">
      <g fill="none" stroke="${M}" stroke-width="2.5" stroke-linecap="round">
        <!-- start dot + run-in -->
        <line x1="90" y1="${SY}" x2="358" y2="${SY}"/>
        <!-- discovery tangle -->
        <ellipse cx="455" cy="600" rx="95" ry="68" transform="rotate(8 455 600)"/>
        <ellipse cx="440" cy="608" rx="78" ry="88" transform="rotate(-30 440 608)"/>
        <ellipse cx="470" cy="592" rx="100" ry="52" transform="rotate(48 470 592)"/>
        <ellipse cx="452" cy="615" rx="58" ry="92" transform="rotate(72 452 615)"/>
        <ellipse cx="462" cy="588" rx="86" ry="64" transform="rotate(-60 462 588)"/>
        <!-- run to first node -->
        <line x1="552" y1="${SY}" x2="764" y2="${SY}"/>
        <!-- design-sprint lens (converging curves) -->
        <line x1="790" y1="${SY}" x2="1210" y2="${SY}"/>
        <path d="M790 ${SY} C 900 510 1100 510 1210 ${SY}"/>
        <path d="M790 ${SY} C 922 562 1078 562 1210 ${SY}"/>
        <path d="M790 ${SY} C 922 672 1078 672 1210 ${SY}"/>
        <path d="M790 ${SY} C 900 724 1100 724 1210 ${SY}"/>
        <!-- delivery wave, then arrow -->
        <path d="M1250 ${SY} C 1310 617 1330 565 1370 565 C 1410 565 1425 672 1460 672
                 C 1500 672 1515 585 1555 585 C 1595 585 1610 ${SY} 1662 ${SY} L 1782 ${SY}"/>
      </g>
      <!-- spine nodes -->
      <circle cx="82" cy="${SY}" r="8" fill="${M}"/>
      <circle cx="772" cy="${SY}" r="8" fill="${M}"/>
      <circle cx="1228" cy="${SY}" r="8" fill="${M}"/>
      <!-- arrowhead -->
      <polygon points="1792,${SY} 1776,609 1776,625" fill="${M}"/>
      </g>
    </svg>`;

    const phaseEls = phases.map((p) =>
      `<p class="g14-phase" style="left:${p.x}px;width:${p.w}px;">${esc(p.t)}</p>`).join("");
    const bracketEl = `<p class="g14-brk">${esc(s.bracketLabel ?? BRACKET_LABEL)}</p>`;
    const midEls = cols.filter((c) => c.mid).map((c) =>
      `<p class="g14-mid" style="left:${c.x}px;">${esc(c.mid)}</p>`).join("");
    const colEls = cols.map((c) => `<div class="g14-col" style="left:${c.x}px;">
      <p class="g14-head">${esc(c.head)}</p>
      <ul class="g14-list">${c.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
    </div>`).join("");

    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        ${pageHeader({ title: s.title ?? TITLE, intro: s.intro ?? INTRO }, { halves: true }).replace('class="v2f-pagehead ', 'class="v2f-pagehead v2f-mn-g14-head ')}
        <div class="v2f-mn-g14 reveal">
          ${svg}
          ${phaseEls}
          ${bracketEl}
          ${midEls}
          ${colEls}
        </div>
        <div class="v2f-mn-g14-sp"></div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
