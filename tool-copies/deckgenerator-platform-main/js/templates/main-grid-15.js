// Template: main/grid-15 — a tiered support-operating-model flow (FIFA L1/L2/L3): source
// actors feed a support ladder of grey team boxes and a black L3 box, branching to a
// service backlog, problem management and three mint governance panels, with resolution
// loops back to the environments. Source Figma frame 342:40483.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { icon } from "../icons.js";

// Nagarro loop mark for the mint panel corners — the hand-drawn scribble loop
// (assets/scribbles/Scribble 1.svg), stroked in the panel's currentColor (mint).
const LOOP = `<svg class="g15-loop" viewBox="0 0 1024 900" fill="none" aria-hidden="true"><path d="M661.9,619.2c-47.5,31.7-112.1-75.7-112.1-187s50.6-207,120-207s120,104.3,120,230.9c0,121.4-46,214.2-107.5,234.6s-169.8-21.3-264-125.1C313.9,450.3,286,329,319.2,294.3s118.1,32.2,118.1,158.8s-48.2,234.6-120,234.6s-121.8-105-121.8-231.6c0-100,32.9-184.9,84.3-219.5c70.5-47.4,175.8-8.7,282.2,104.8C660.8,446.7,709.6,580.1,661.9,619.2z" stroke="currentColor" stroke-width="34" stroke-linejoin="round"/></svg>`;

export default {
  name: "main/grid-15", slide: -14, figmaNode: "342:40483",
  family: "main", role: "content", shape: "diagram", theme: "light", chrome: false,
  use: "A tiered support operating model — source actors feed an L1/L2/L3 support ladder that branches to a service backlog, problem management and governance panels, looping resolutions back to the environments.",
  media: [], capacity: { items: 12, min: 8, max: 14 },
  slots: { images: 0, titles: 0, body: 12, stats: 0, icons: 6 },
  description: "main/grid-15 — FIFA L1/L2/L3 support operating-model flow.",
  schema: {
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const G = "rgba(1,7,22,.4)"; // connector ink
    const arR = (x, y) => `<polygon points="${x},${y} ${x - 9},${y - 5} ${x - 9},${y + 5}" fill="${G}"/>`;
    const arL = (x, y) => `<polygon points="${x},${y} ${x + 9},${y - 5} ${x + 9},${y + 5}" fill="${G}"/>`;
    const arD = (x, y) => `<polygon points="${x},${y} ${x - 5},${y - 9} ${x + 5},${y - 9}" fill="${G}"/>`;
    const arU = (x, y) => `<polygon points="${x},${y} ${x - 5},${y + 9} ${x + 5},${y + 9}" fill="${G}"/>`;
    // orthogonal connector with softly rounded corners (radius R at each bend)
    const pl = (pts, R = 14) => {
      const p = pts.trim().split(/\s+/).map((s) => s.split(",").map(Number));
      if (p.length < 2) return "";
      let d = `M ${p[0][0]} ${p[0][1]}`;
      for (let i = 1; i < p.length - 1; i++) {
        const [px, py] = p[i - 1], [x, y] = p[i], [nx, ny] = p[i + 1];
        const d1 = Math.hypot(x - px, y - py) || 1, d2 = Math.hypot(nx - x, ny - y) || 1;
        const r = Math.min(R, d1 / 2, d2 / 2);
        const ax = x - ((x - px) / d1) * r, ay = y - ((y - py) / d1) * r;
        const bx = x + ((nx - x) / d2) * r, by = y + ((ny - y) / d2) * r;
        d += ` L ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${x} ${y} ${bx.toFixed(1)} ${by.toFixed(1)}`;
      }
      const last = p[p.length - 1];
      d += ` L ${last[0]} ${last[1]}`;
      return `<path d="${d}" fill="none" stroke="${G}" stroke-width="1.5" stroke-linecap="round"/>`;
    };

    const svg = `<svg class="g15-svg" viewBox="0 0 1920 1080" width="1920" height="1080" aria-hidden="true">
      <g>
        <!-- sources: Monitoring merges into the FIFA-team line, one arrow into L1 -->
        ${pl("290,324 408,324 408,485 518,485")}${arR(520, 485)}
        ${pl("292,485 408,485")}
        <!-- Third Party Vendor -> L1 -->
        ${pl("612,406 612,452")}${arD(612, 454)}
        <!-- L1 -> L2 (not resolved) -->
        ${pl("704,486 772,486 772,574")}${arD(772, 578)}
        <!-- L2 -> L3 (not resolved): approaches from above, down into L3's top edge -->
        ${pl("908,650 965,650 965,690")}${arD(965, 694)}
        <!-- L1 & L3 both escalate to Reporting & Governance (merge at 1000,300);
             L1 leg exits at x690 to clear the Third Party Vendor icon/label -->
        ${pl("1000,690 1000,300 1614,300")}${arR(1618, 300)}
        ${pl("690,456 690,300 1000,300")}
        <!-- L2 -> Problem Management -->
        ${pl("800,578 800,488 1360,488 1360,504")}${arD(1360, 508)}
        <!-- L2 -> KMDB/KEDB (direct) -->
        ${pl("850,578 850,430 1614,430")}${arR(1618, 430)}
        <!-- Problem Management -> Change Management -->
        ${pl("1508,548 1585,548 1585,690 1614,690")}${arR(1618, 690)}
        <!-- L3 -> Service Backlog (initiate Change) -->
        ${pl("1050,690 1050,637 1146,637")}${arR(1148, 637)}
        <!-- Service Backlog -> Change Management -->
        ${pl("1292,637 1614,637")}${arR(1618, 637)}
        <!-- L3 -> Change Management (initiate a change, emergency) -->
        ${pl("1119,772 1614,772")}${arR(1618, 772)}
        <!-- support teams feed ongoing activities -->
        ${pl("728,662 376,662")}${arL(372, 662)}
        <!-- L1 -> Incident / Request closed (/resolved) -->
        ${pl("540,608 540,782 290,782")}${arL(286, 782)}
        <!-- L2 -> L1 (status update / resolved): loop verticals kept left of x600 so
             the labels have a clear channel to the right, before L2's edge -->
        ${pl("818,736 818,758 565,758 565,612")}${arU(565, 608)}
        <!-- L3 -> L1 (status update / resolved): exits L3's left edge, runs well above
             Staging/Pre-Prod, then up into L1 -->
        ${pl("933,838 590,838 590,612")}${arU(590, 608)}
        <!-- L3 -> Staging/Pre-Prod -->
        ${pl("1025,853 1025,884")}${arD(1025, 886)}
        <!-- Change Management -> Staging -> Production -->
        ${pl("1614,920 1110,920")}${arL(1106, 920)}
        ${pl("862,920 290,920")}${arL(286, 920)}
      </g>
    </svg>`;

    const nb = (cls, x, y, w, h, t) =>
      `<div class="g15-nb ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;">${t}</div>`;
    const lbl = (x, y, t, extra = "") =>
      `<p class="g15-lb" style="left:${x}px;top:${y}px;${extra}">${t}</p>`;
    const src = (x, y, ic, t) => `<div class="g15-src" style="left:${x}px;top:${y}px;">
      <span class="g15-sic">${icon(ic)}</span><p>${esc(t)}</p></div>`;
    const panel = (x, y, w, h, ic, t, loop) =>
      `<div class="g15-panel" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;">
        ${loop ? `<span class="g15-pl">${LOOP}</span>` : ""}
        <span class="g15-pic">${icon(ic)}</span><p>${t}</p></div>`;

    const ONGOING = [
      { ic: "webpage-on-desktop", t: "Dashboard status monitoring" },
      { ic: "card-scanning", t: "Dashboard Validation" },
      { ic: "gears", t: "Trouble-shooting" },
      { ic: "hand-gear", t: "Bug Fixing" },
    ];

    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-g15 reveal">
          ${svg}

          ${src(200, 300, "group-of-people", "FIFA team")}
          ${src(200, 438, "group-of-people", "Monitoring Tools")}
          <div class="g15-vendor" style="left:552px;top:232px;">
            <span class="g15-vic">${icon("group-of-people")}</span>
            <p>Third Party<br>Vendor</p>
          </div>

          ${nb("grey", 522, 456, 182, 152, "FIFA L1<br>Support<br>Team")}
          ${nb("grey", 728, 578, 180, 158, "FIFA L2<br>Support<br>Team")}
          ${nb("grey wide", 1272, 508, 236, 66, "Problem<br>Management")}
          ${nb("black", 933, 690, 186, 164, "Nagarro L3<br>Support<br>Team")}
          ${nb("circle", 1148, 565, 144, 144, "Service<br>Backlog")}

          ${nb("mint", 40, 752, 244, 70, "Incident/<br>Request closed")}
          ${nb("mint", 40, 886, 244, 72, "Production<br>Environment")}
          ${nb("mint", 862, 886, 244, 68, "Staging/Pre-Prod<br>Environment")}

          <div class="g15-ongoing" style="left:40px;top:590px;">
            <p class="g15-oh">ongoing activities</p>
            <div class="g15-ocard">
              ${ONGOING.map((o) => `<div class="g15-ocol"><span class="g15-oic">${icon(o.ic)}</span><p>${esc(o.t)}</p></div>`).join("")}
            </div>
          </div>

          ${panel(1620, 180, 259, 180, "note", "Reporting<br>&amp; Governance", true)}
          ${panel(1620, 380, 259, 179, "org-chart", "KMDB/KEDB", true)}
          ${panel(1620, 580, 259, 402, "sissors", "Change<br>Management", true)}

          ${lbl(330, 468, "Alert")}
          ${lbl(380, 466, "Ticket by users", "transform:rotate(-90deg);transform-origin:left top;")}
          ${lbl(712, 436, "not<br>resolved")}
          ${lbl(915, 600, "not<br>resolved")}
          ${lbl(1040, 588, "initiate<br>Change")}
          ${lbl(1128, 728, "initiate a change<br>(for emergency bug fix)", "line-height:24px;")}
          ${lbl(612, 710, "status update")}
          ${lbl(612, 732, "/resolved")}
          ${lbl(612, 788, "status update")}
          ${lbl(612, 810, "/resolved")}
          ${lbl(378, 758, "/resolved")}
        </div>
        <div class="v2f-mn-g15-sp"></div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
