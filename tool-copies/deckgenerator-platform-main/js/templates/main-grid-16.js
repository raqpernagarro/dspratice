// Template: main/grid-16 — a horizontal token-architecture pipeline: six labelled stages
// (cards, some mint) linked by arrows, with a repository merge (+) and a platform/app
// branch. Source Figma frame 342:40598.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const D = {
  design: "Figma DS + Variables",
  transform: "VariableS to Code Artifacts",
  repoA: "Tokens, Themes, Component Library",
  repoB: "Common React Components",
  platformTop: "Web Components", platformBot: "Mobile Components",
  appTop: "Web Components", appBot: "Mobile Components",
  backend: "APIs, Microservices, CMS",
};
const L = {
  design: "Design Layer", transform: "Token Transformation", repo: "DS Repository",
  platform: "Platform Specific Libraries", app: "Application Layer", backend: "Existing Backend Platform",
};

export default {
  name: "main/grid-16", slide: -13, figmaNode: "342:40598",
  family: "main", role: "content", shape: "diagram", theme: "light", chrome: false,
  use: "A horizontal token-architecture pipeline — six labelled stages linked by arrows, with a repository merge and a platform/app branch.",
  media: [], capacity: { items: 9, min: 6, max: 9 },
  slots: { images: 0, titles: 1, body: 9, stats: 0, icons: 0 },
  description: "main/grid-16 — 6-stage design-system token architecture flow.",
  schema: {
    title: "string — heading", cards: "{ design, transform, repoA, repoB, platformTop, platformBot, appTop, appBot, backend }",
    labels: "{ design, transform, repo, platform, app, backend }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Proposed Design System Token Architecture", cards: D, labels: L,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const c = { ...D, ...(s.cards || {}) };
    const l = { ...L, ...(s.labels || {}) };
    const AR = `<svg class="ar" viewBox="0 0 40 12" aria-hidden="true"><line x1="0" y1="6" x2="31" y2="6"/><polyline points="26,1.5 33,6 26,10.5"/></svg>`;
    const ARL = `<svg class="ar" viewBox="0 0 40 12" aria-hidden="true"><line x1="9" y1="6" x2="40" y2="6"/><polyline points="14,1.5 7,6 14,10.5"/></svg>`;
    const arr = () => `<div class="g16-arr"><span class="a">${AR}</span></div>`;
    const arr2 = () => `<div class="g16-arr two"><span class="a">${AR}</span><span class="a">${AR}</span></div>`;
    // App <-> Backend: top row flows back (left), bottom row flows forward (right)
    const arr2LR = () => `<div class="g16-arr two"><span class="a">${ARL}</span><span class="a">${AR}</span></div>`;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-g16 reveal">
          ${s.title ? `<p class="ttl">${esc(s.title)}</p>` : ""}
          <div class="g16-stages">
            <div class="g16-stage"><p class="g16-lbl">${esc(l.design)}</p><div class="g16-cards"><div class="g16-card mint">${esc(c.design)}</div></div></div>
            ${arr()}
            <div class="g16-stage"><p class="g16-lbl">${esc(l.transform)}</p><div class="g16-cards"><div class="g16-card">${esc(c.transform)}</div></div></div>
            ${arr()}
            <div class="g16-stage wide"><p class="g16-lbl">${esc(l.repo)}</p><div class="g16-cards rowc">
              <div class="g16-card">${esc(c.repoA)}</div><span class="g16-plus">+</span><div class="g16-card mint">${esc(c.repoB)}</div>
            </div></div>
            ${arr2()}
            <div class="g16-stage"><p class="g16-lbl">${esc(l.platform)}</p><div class="g16-cards colc">
              <div class="g16-card">${esc(c.platformTop)}</div><div class="g16-card">${esc(c.platformBot)}</div>
            </div></div>
            ${arr2()}
            <div class="g16-stage"><p class="g16-lbl">${esc(l.app)}</p><div class="g16-cards colc">
              <div class="g16-card nested"><span>${esc(c.appTop)}</span></div><div class="g16-card nested"><span>${esc(c.appBot)}</span></div>
            </div></div>
            ${arr2LR()}
            <div class="g16-stage"><p class="g16-lbl">${esc(l.backend)}</p><div class="g16-cards"><div class="g16-card">${esc(c.backend)}</div></div></div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
