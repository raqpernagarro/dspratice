// Template: main/grid-13 — a freeform flowchart "building blocks" kit: rounded titled
// boxes, paragraph cards, branching connectors, bullet-list cards, dashed notes, a legend
// pill and three Server nodes plus a browser/globe endpoint. Source Figma frame 342:40329.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

const PARA = "This is a very long and extensive paragraph that ends here.";
const BULLETS = ["Bullet Point 1", "Bullet Point 2", "Bullet Point 3"];

export default {
  name: "main/grid-13", slide: -17, figmaNode: "342:40329",
  family: "main", role: "content", shape: "diagram", theme: "light", chrome: false,
  use: "A freeform flowchart building-block kit — titled boxes, paragraph cards, branching connectors, bullet-list cards, dashed notes, Server nodes and a browser endpoint.",
  media: [], capacity: { items: 9, min: 4, max: 12 },
  slots: { images: 0, titles: 2, body: 9, stats: 0, icons: 0 },
  description: "main/grid-13 — freeform flowchart element kit.",
  schema: {
    caption: "string — eyebrow", title: "string — heading", subtitle: "string — muted 2nd line",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Title", subtitle: "Subtitle",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const K = "rgba(1,7,22,.8)"; // connector ink
    const GREY = "rgba(1,7,22,.4)"; // muted ink for the small-note connector
    // arrowheads
    const arR = (x, y) => `<polygon points="${x},${y} ${x - 9},${y - 5} ${x - 9},${y + 5}" fill="${K}"/>`;
    const arD = (x, y) => `<polygon points="${x},${y} ${x - 5},${y - 9} ${x + 5},${y - 9}" fill="${K}"/>`;

    const svg = `<svg class="g13-svg" viewBox="0 0 1920 1080" width="1920" height="1080" aria-hidden="true">
      <g fill="none" stroke="${K}" stroke-width="1.5" stroke-linecap="round">
        <line x1="228" y1="430" x2="330" y2="430"/>
        <line x1="574" y1="430" x2="685" y2="430"/>
        <!-- C -> branch to D / E (softly rounded corners) -->
        <line x1="981" y1="560" x2="1006" y2="560"/>
        <path d="M1006 560 Q1016 560 1016 550 V480 Q1016 470 1026 470 H1046"/>
        <path d="M1006 560 Q1016 560 1016 570 V640 Q1016 650 1026 650 H1046"/>
        <!-- C -> browser -->
        <line x1="836" y1="772" x2="836" y2="828"/>
      </g>
      <!-- A -> dashed note (muted grey) -->
      <path d="M134 488 L134 600 L179 600" fill="none" stroke="${GREY}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 6"/>
      ${arR(336, 430)}${arR(691, 430)}${arR(1051, 470)}${arR(1051, 650)}${arD(836, 834)}
      <polygon points="183,600 176,595 176,605" fill="${GREY}"/>
      <!-- three Server nodes -->
      <circle class="g13-s1" cx="78" cy="882" r="38" fill="#06041f"/>
      <circle cx="190" cy="882" r="38" fill="var(--mint-green,#47d7ac)"/>
      <circle class="g13-s3" cx="303" cy="882" r="38" fill="#d3f0e5"/>
      <text class="g13-s1t" x="78" y="887" text-anchor="middle" fill="#fff" font-family="Equip, sans-serif" font-size="15">Server</text>
      <text x="190" y="887" text-anchor="middle" fill="#fff" font-family="Equip, sans-serif" font-size="15">Server</text>
      <text class="g13-s3t" x="303" y="887" text-anchor="middle" fill="#06041f" font-family="Equip, sans-serif" font-size="15">Server</text>
      <!-- browser / globe endpoint -->
      <g>
        <rect x="775" y="838" width="116" height="88" rx="8" fill="#fff" stroke="rgba(1,7,22,.2)"/>
        <path d="M775 858 h116" stroke="rgba(1,7,22,.2)" stroke-width="1" fill="none"/>
        <circle cx="787" cy="848" r="2.5" fill="rgba(1,7,22,.25)"/>
        <circle cx="796" cy="848" r="2.5" fill="rgba(1,7,22,.25)"/>
        <circle cx="805" cy="848" r="2.5" fill="rgba(1,7,22,.25)"/>
        <g transform="translate(833 892)" fill="none" stroke="rgba(1,7,22,.5)" stroke-width="1.4">
          <circle cx="0" cy="0" r="15"/><ellipse cx="0" cy="0" rx="6.5" ry="15"/>
          <line x1="-15" y1="0" x2="15" y2="0"/><line x1="-13" y1="-7" x2="13" y2="-7"/><line x1="-13" y1="7" x2="13" y2="7"/>
        </g>
      </g>
    </svg>`;

    const box = (cls, x, y, w, h, inner) =>
      `<div class="g13-box ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;">${inner}</div>`;
    const bulletCard = (x, y) => box("g13-bul", x, y, 300, 164,
      BULLETS.map((b) => `<p class="g13-brow">${esc(b)}</p>`).join(""));
    // connector origin dots on a top layer so they sit IN FRONT of the boxes
    const dots = `<svg class="g13-dots" viewBox="0 0 1920 1080" width="1920" height="1080" aria-hidden="true">
      ${[[228, 430, K], [574, 430, K], [134, 488, GREY], [981, 560, K], [836, 772, K]]
        .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`).join("")}
    </svg>`;

    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        ${pageHeader({ caption: s.caption, title: s.title ?? "Title", subtitle: s.subtitle ?? "Subtitle" })}
        <div class="v2f-mn-g13 reveal">
          ${svg}
          ${box("g13-titled", 40, 372, 188, 116, `<p class="g13-t">Title</p><p class="g13-p">This is a paragraph</p>`)}
          ${box("g13-card", 340, 378, 234, 104, `<p class="g13-p">${esc(PARA)}</p>`)}
          ${box("g13-note dash", 185, 578, 104, 44, `<span>small note</span>`)}
          ${box("g13-cont", 695, 372, 286, 400, `
            <p class="g13-t">Title</p>
            ${box("g13-card inner", 25, 80, 236, 92, `<p class="g13-p">${esc(PARA)}</p>`)}
            ${box("g13-card inner", 25, 208, 236, 100, `<p class="g13-p">${esc(PARA)}</p>`)}
            ${box("g13-note dash inner", 25, 328, 236, 44, `<span>small note</span>`)}
          `)}
          ${bulletCard(1052, 382)}
          ${bulletCard(1052, 568)}
          ${box("g13-far", 1622, 375, 260, 366, `
            <p class="g13-p">${esc(PARA)}</p>
            <ul class="g13-ul">${[0, 1, 2].map(() => `<li>${esc(PARA)}</li>`).join("")}</ul>
          `)}
          ${box("g13-pill", 40, 780, 300, 40, `<span>small note</span>`)}
          ${dots}
        </div>
        <div class="v2f-mn-g13-sp"></div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
