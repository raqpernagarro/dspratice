// =============================================================================
// Shared content blocks for the v2 "planning" templates — the reusable pieces the
// Figma "Planning" master (node 105:2632) is built from: roadmap / phase timelines,
// a target staircase, phase cards, Gantt charts, weekly-output + content-plan
// matrices, an annual calendar grid, proposition cards, and (batch 2) arches, sprint
// lists, milestone photo timelines, an org chart and profile rosters. All hand-built
// in CSS/SVG. CSS lives in css/primitives.css under the .v2f-pl-* namespace. Reuses
// the shared chrome (frame.js) + brand tokens (and the --fin-* surface colours).
// =============================================================================
import { esc } from "./components.js";
import { topBar } from "./frame.js";

/* ---- brand photography pools (avatars + scene shots) --------------------- */
// Self-hosted Nagarro people photos (assets/photography). Cycled so a deck can
// fill any number of avatar / milestone image slots without bespoke wiring.
const P = "assets/photography/";
const PL_AVATARS = [
  "20200717-104027_Nagarro_4306.jpg", "20200717-104101_Nagarro_4314.jpg",
  "20200717-104245_Nagarro_4361.jpg", "AZ1A4217.jpg", "AZ1A4306.jpg",
  "AZ1A4651_edit.jpg", "20200717-103815_Nagarro_958.jpg",
  "20200717-104133_Nagarro_4328.jpg", "20200717-112113_Nagarro_4403.jpg",
  "20200717-104209_Nagarro_4345.jpg", "AZ1A4132.jpg", "AZ1A4483_edit.jpg",
  "AZ1A4276.jpg", "AZ1A4536.jpg", "AZ1A4537.jpg", "20200717-104823_Nagarro_1150.jpg",
];
const PL_SCENES = [
  "20200717-091142_Nagarro_415.jpg", "20200717-091246_Nagarro_424.jpg",
  "20200717-091614_Nagarro_444.jpg", "20200717-091737_Nagarro_464.jpg",
  "20200717-092339_Nagarro_499.jpg", "20200717-093647_Nagarro_551.jpg",
  "20200717-112030_Nagarro_4400.jpg", "20200717-112115_Nagarro_1473.jpg",
  "20200717-112125_Nagarro_1481.jpg", "20200717-084726_Nagarro_295.jpg",
];
/** Cycled avatar / scene photo paths for image slots. */
export const plAvatar = (i = 0) => P + PL_AVATARS[((i % PL_AVATARS.length) + PL_AVATARS.length) % PL_AVATARS.length];
export const plScene = (i = 0) => P + PL_SCENES[((i % PL_SCENES.length) + PL_SCENES.length) % PL_SCENES.length];

/* ---- heads -------------------------------------------------------------- */
/** Split head: left caption/title/subtitle + optional right body paragraph. */
export const plSplitHead = ({ caption, title, subtitle, body } = {}) => `
  <div class="v2f-pl-head reveal">
    <div class="v2f-pl-headL">
      ${caption ? `<p class="v2f-caption">${esc(caption)}</p>` : ""}
      ${title ? `<p class="v2f-title">${esc(title)}</p>` : ""}
      ${subtitle ? `<p class="v2f-subtitle">${esc(subtitle)}</p>` : ""}
    </div>
    ${body ? `<p class="v2f-pl-headbody">${esc(body)}</p>` : ""}
  </div>`;

/** Eyebrow caption over a bold display title, with an optional grey subtitle. */
export const plBoldHead = ({ caption, title, subtitle } = {}) => `
  <div class="v2f-pl-head reveal">
    <div class="v2f-pl-headL">
      ${caption ? `<p class="v2f-caption">${esc(caption)}</p>` : ""}
      ${title ? `<p class="v2f-pl-boldtitle">${esc(title)}</p>` : ""}
      ${subtitle ? `<p class="v2f-subtitle">${esc(subtitle)}</p>` : ""}
    </div>
  </div>`;

/* ---- week timeline w/ pills + bullets under the active node (cover) ------ */
/** items = [{ label, active }]; bullets = [string] shown under the active pill. */
export const plWeekTimeline = ({ items = [], bullets = [] } = {}) => {
  const activeIdx = Math.max(0, items.findIndex((i) => i.active));
  const row = items
    .map((i) => `<div class="v2f-pl-wk">
      <span class="pill${i.active ? " active" : ""}">${esc(i.label ?? "")}</span>
      <span class="dot${i.active ? " active" : ""}"></span>
    </div>`)
    .join("");
  const bcells = items
    .map((_, i) => `<div class="bcell">${i === activeIdx
      ? `<ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
      : ""}</div>`)
    .join("");
  return `<div class="v2f-pl-weekwrap reveal">
    <div class="v2f-pl-weekrow">${row}</div>
    <div class="v2f-pl-weekbullets">${bcells}</div>
  </div>`;
};

/* ---- phase timeline: axis + phase columns (data-01) --------------------- */
/** phases = [{ label, bold, month, sub, body }] laid out across an arrowed axis. */
export const plPhaseTimeline = (phases = []) => {
  const cols = phases
    .map((p) => `<div class="v2f-pl-phcol">
      <p class="ph${p.bold ? " bold" : ""}">${esc(p.label ?? "")}</p>
      <span class="dot"></span>
      <div class="body">
        ${p.month ? `<p class="mo">${esc(p.month)}</p>` : ""}
        ${p.sub ? `<p class="sub">${esc(p.sub)}</p>` : ""}
        ${p.body ? `<p class="bd">${esc(p.body)}</p>` : ""}
      </div>
    </div>`)
    .join("");
  // axis first so the white dots (inside the columns) paint on top and mask the line
  return `<div class="v2f-pl-phase reveal"><div class="v2f-pl-phrow"><span class="v2f-pl-phaxis"></span>${cols}</div></div>`;
};

/* ---- ascending target staircase (grid-02) ------------------------------- */
/** cards = [string] filled step labels (bottom-left → top-right); ticks = axis
 *  labels (cards.length + 1). Cells above the diagonal are light placeholders. */
export const plStaircase = ({ cards = [], ticks = [] } = {}) => {
  const n = cards.length || 1;
  let grid = "";
  for (let r = n - 1; r >= 0; r--)
    for (let c = 0; c < n; c++)
      grid += c < r ? `<div class="v2f-pl-scell empty"></div>`
        : c === r ? `<div class="v2f-pl-scell fill">${esc(cards[r])}</div>`
        : `<div class="v2f-pl-scell light"></div>`;
  return `<div class="v2f-pl-stair reveal">
    <div class="v2f-pl-sgrid" style="grid-template-columns:repeat(${n},1fr);grid-template-rows:repeat(${n},1fr)">${grid}</div>
    <div class="v2f-pl-saxis"></div>
    <div class="v2f-pl-sticks">${ticks.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
  </div>`;
};

/* ---- phase cards, one active (grid-03) ---------------------------------- */
/** cards = [{ title, sub, active }] — a row of phase cards, one highlighted. */
export const plPhaseCards = (cards = []) =>
  `<div class="v2f-pl-pcards reveal">${cards
    .map((c) => `<div class="v2f-pl-pcard${c.active ? " active" : ""}">
      <p class="t">${esc(c.title ?? "")}</p>
      ${c.sub ? `<p class="s">${esc(c.sub)}</p>` : ""}
    </div>`)
    .join("")}</div>`;

/* ---- Gantt chart (grid-11 quarters, grid-12 12-month) ------------------- */
/** columns = [labels]; groups = [{ label, span }] optional header row; rows =
 *  [{ label, start, span }] with a dark bar from column `start` spanning `span`. */
export const plGantt = ({ columns = [], groups = [], rows = [] } = {}) => {
  const n = columns.length || 1;
  const groupRow = groups.length
    ? `<div class="v2f-pl-gantt-groups" style="grid-template-columns:var(--gl) repeat(${n},1fr)">
        <span></span>${groups.map((g) => `<span class="g" style="grid-column:span ${g.span}">${esc(g.label)}</span>`).join("")}</div>`
    : "";
  const head = `<div class="v2f-pl-gantt-head" style="grid-template-columns:var(--gl) repeat(${n},1fr)">
    <span></span>${columns.map((c) => `<span class="c">${esc(c)}</span>`).join("")}</div>`;
  const body = rows
    .map((r) => {
      const cells = Array.from({ length: n }, () => `<span class="cell"></span>`).join("");
      // one bar per row, grid-positioned so both ends round cleanly (col 1 is the label)
      const bar = r.start != null
        ? `<span class="bar" style="grid-column:${r.start + 2} / span ${r.span ?? 1}"></span>`
        : "";
      // an empty row (no label, no bar) is a grey separator lane; content rows stay white
      const sep = !r.label && r.start == null;
      return `<div class="v2f-pl-gantt-row${sep ? " sep" : ""}" style="grid-template-columns:var(--gl) repeat(${n},1fr)">
        <span class="lk">${esc(r.label ?? "")}</span>${cells}${bar}</div>`;
    })
    .join("");
  return `<div class="v2f-pl-gantt reveal">${groupRow}${head}<div class="v2f-pl-gantt-rows">${body}</div></div>`;
};

/* ---- phase band: an arrowed axis over labelled paragraph columns --------- */
/** A footer band (grid-11): a horizontal arrowed line above a row of columns,
 *  each with a bold label and a paragraph. cols = [{ label, body }]. */
export const plPhaseBand = (cols = []) => `
  <div class="v2f-pl-band reveal">
    <div class="v2f-pl-bandaxis"></div>
    <div class="v2f-pl-bandrow">${cols
      .map((c) => `<div class="v2f-pl-bandcol"><p class="h">${esc(c.label ?? "")}</p>${c.body ? `<p class="b">${esc(c.body)}</p>` : ""}</div>`)
      .join("")}</div>
  </div>`;

/* ---- weekly output table w/ bulleted cells (grid-13) -------------------- */
/** header = [left, right] dark band; columns = [week labels]; rows = [{ cells:[[bullets]] }]. */
export const plOutputTable = ({ header = [], columns = [], rows = [] } = {}) => {
  const band = header.length
    ? `<div class="v2f-pl-otband"><span>${esc(header[0] ?? "")}</span><span>${esc(header[1] ?? "")}</span></div>`
    : "";
  const head = `<div class="v2f-pl-otrow head">${columns.map((c) => `<div class="v2f-pl-otc">${esc(c)}</div>`).join("")}</div>`;
  const body = rows
    .map((r) => `<div class="v2f-pl-otrow">${(r.cells || [])
      .map((cell) => `<div class="v2f-pl-otc"><ul>${(cell || []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>`)
      .join("")}</div>`)
    .join("");
  return `<div class="v2f-pl-output reveal">${band}${head}${body}</div>`;
};

/* ---- content-plan matrix (data-02) -------------------------------------- */
/** columns = [channel labels]; rows = [{ label, cells:[[bullets]] }]. */
export const plMatrix = ({ columns = [], rows = [] } = {}) => {
  const head = `<div class="v2f-pl-mrow head"><div class="v2f-pl-mc lk"></div>${columns
    .map((c) => `<div class="v2f-pl-mc">${esc(c)}</div>`)
    .join("")}</div>`;
  const body = rows
    .map((r) => `<div class="v2f-pl-mrow"><div class="v2f-pl-mc lk">${esc(r.label ?? "")}</div>${(r.cells || [])
      .map((cell) => `<div class="v2f-pl-mc"><ul>${(cell || []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>`)
      .join("")}</div>`)
    .join("");
  return `<div class="v2f-pl-matrix reveal">${head}${body}</div>`;
};

/* ---- annual calendar grid (grid-14) ------------------------------------- */
/** quarters = [{ label, months:[{ month, title }] }] → 4 columns of month cards. */
export const plCalendar = (quarters = []) =>
  `<div class="v2f-pl-cal reveal">${quarters
    .map((q) => `<div class="v2f-pl-calcol">
      <p class="q">${esc(q.label ?? "")}</p>
      ${(q.months || []).map((m) => `<div class="v2f-pl-calcard"><p class="m">${esc(m.month ?? "")}</p><p class="t">${esc(m.title ?? "")}</p></div>`).join("")}
    </div>`)
    .join("")}</div>`;

/* ---- dashed arch phases (grid-04) --------------------------------------- */
/** phases = [{ num, label, body, active }] under a row of dashed dome arches. */
export const plArches = (phases = []) => {
  const n = phases.length || 1, W = 1840, seg = W / n;
  // true semicircles: rx == ry (== half the dome width); H holds the full radius
  const rx = seg / 2, ry = rx, H = Math.round(ry) + 22, baseY = H - 10;
  let domes = "", dots = "";
  for (let i = 0; i < n; i++) {
    const x0 = i * seg, x1 = (i + 1) * seg;
    domes += `<path d="M${x0},${baseY} A${rx},${ry} 0 0 1 ${x1},${baseY} Z" fill="url(#plArch)"/>`;
    domes += `<path d="M${x0},${baseY} A${rx},${ry} 0 0 1 ${x1},${baseY}" fill="none" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="2 5"/>`;
  }
  // end dots stay fully visible thanks to overflow:visible on .v2f-pl-domes
  for (let i = 0; i <= n; i++) dots += `<circle cx="${(i * seg).toFixed(1)}" cy="${baseY}" r="7" fill="#fff" stroke="#010716" stroke-width="1.5"/>`;
  const labels = phases
    .map((p) => `<div class="v2f-pl-archcol${p.active ? " active" : ""}">
      <p class="h"><span class="n">${esc(p.num ?? "")}</span> ${esc(p.label ?? "")}</p>
      ${p.body ? `<p class="b">${esc(p.body)}</p>` : ""}
    </div>`)
    .join("");
  return `<div class="v2f-pl-arches reveal">
    <svg class="v2f-pl-domes" viewBox="0 0 ${W} ${H}">
      <defs><linearGradient id="plArch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4e7ea"/><stop offset="1" stop-color="#fcfcfd"/></linearGradient></defs>
      ${domes}${dots}
    </svg>
    <div class="v2f-pl-archlabels">${labels}</div>
  </div>`;
};

/* ---- gantt pills across months (grid-05) -------------------------------- */
/** months = [string] (spread evenly above); pills = [{ label, grow, active }];
 *  today = { at:0..1 } marker below. */
export const plGanttPills = ({ months = [], pills = [], today = null } = {}) => `
  <div class="v2f-pl-gpills reveal">
    <div class="v2f-pl-gpmonths">${months.map((m) => `<span>${esc(m)}</span>`).join("")}</div>
    <div class="v2f-pl-gpwrap">
      <div class="v2f-pl-gprow">${pills
        .map((p) => `<div class="v2f-pl-gpill${p.active ? " active" : ""}" style="flex:${p.grow ?? 1} 1 0">${esc(p.label ?? "")}</div>`)
        .join("")}</div>
      ${today ? `<div class="v2f-pl-gptoday" style="left:${(today.at ?? 0.5) * 100}%">Today</div>` : ""}
    </div>
  </div>`;

/* ---- sprint list panel (grid-06) ---------------------------------------- */
/** groups = [{ sprint, rows:[{ week, phase }], iterations:[string] }]. */
export const plSprintPanel = (groups = []) => `
  <div class="v2f-pl-sprintpanel reveal">${groups
    .map((g) => `<div class="v2f-pl-sprintgroup">
      <div class="v2f-pl-sprintlbl">${esc(g.sprint ?? "")}</div>
      <div class="v2f-pl-sprintweeks">${(g.rows || [])
        .map((r) => `<div class="v2f-pl-sprintwk"><p class="wk">${esc(r.week ?? "")}</p><div class="phase">${esc(r.phase ?? "")}</div></div>`)
        .join("")}</div>
      <div class="v2f-pl-sprintiters">${(g.iterations || []).map((it) => `<div class="it">${esc(it)}</div>`).join("")}</div>
    </div>`)
    .join("")}</div>`;

/* ---- milestone photo timeline (grid-07/08/09/10) ------------------------ */
/** above / below = [{ image, title, body, active }] rows of milestone cards, each
 *  tied to a central arrowed axis by a short tick. `active:false` fades a card. */
export const plMilestones = ({ above = [], below = [], tick = {}, roomy = false } = {}) => {
  const cols = Math.max(above.length, below.length, 1);
  const basis = (100 / cols).toFixed(4);
  // tick alignment per row: "left" (under the card's left edge) or "center"
  const ta = tick.above || "left", tb = tick.below || "center";
  const card = (it, pos, align) => `<div class="v2f-pl-msslot ${pos} tk-${align}" style="flex:0 0 ${basis}%">
    <div class="v2f-pl-mscard${it.active === false ? " faded" : ""}">
      <div class="v2f-pl-msimg">${it.image ? `<img src="${esc(it.image)}" alt="">` : ""}</div>
      <div class="v2f-pl-mstext"><p class="t">${esc(it.title ?? "Title")}</p>${it.body ? `<p class="b">${esc(it.body)}</p>` : ""}</div>
    </div>
    <span class="tick"></span>
  </div>`;
  return `<div class="v2f-pl-ms${roomy ? " roomy" : ""} reveal">
    <div class="v2f-pl-msrow above">${above.map((it) => card(it, "above", ta)).join("")}</div>
    <div class="v2f-pl-msaxis"></div>
    <div class="v2f-pl-msrow below">${below.map((it) => card(it, "below", tb)).join("")}</div>
  </div>`;
};

/* ---- profile cards (data-03 4-up, data-04 5-up) ------------------------- */
/** cards = [{ image, name, title, body }]. */
export const plProfileCards = (cards = []) =>
  `<div class="v2f-pl-profiles reveal">${cards
    .map((c) => `<div class="v2f-pl-profile">
      <div class="v2f-pl-profimg">${c.image ? `<img src="${esc(c.image)}" alt="">` : ""}</div>
      <p class="n">${esc(c.name ?? "Name")}</p>
      <p class="t">${esc(c.title ?? "Title")}</p>
      ${c.body ? `<p class="b">${esc(c.body)}</p>` : ""}
    </div>`)
    .join("")}</div>`;

/* ---- leadership roster (grid-16) ---------------------------------------- */
/** leaders = [{ image, name, role }] (featured); team = [{ image, name, role }] (grid). */
export const plLeadership = ({ leaders = [], team = [] } = {}) => `
  <div class="v2f-pl-lead reveal">
    <div class="v2f-pl-leadcol">${leaders
      .map((l) => `<div class="v2f-pl-leader"><div class="ph">${l.image ? `<img src="${esc(l.image)}" alt="">` : ""}</div><div class="tx"><p class="n">${esc(l.name ?? "Jane Doe")}</p><p class="r">${esc(l.role ?? "")}</p></div></div>`)
      .join("")}</div>
    <div class="v2f-pl-leadgrid">${team
      .map((t) => `<div class="v2f-pl-teammate"><div class="ph">${t.image ? `<img src="${esc(t.image)}" alt="">` : ""}</div><p class="n">${esc(t.name ?? "Lorem Ipsum")}</p><p class="r">${esc(t.role ?? "Lorem Ipsum")}</p></div>`)
      .join("")}</div>
  </div>`;

/* ---- organisation chart (grid-15) --------------------------------------- */
const orgPill = (m, cls = "") => `<div class="v2f-pl-orgpill ${cls}"><p class="n">${esc(m.name ?? "Name")}</p><p class="r">${esc(m.role ?? "Role")}</p></div>`;
const orgDept = (d, faded = false) => `<div class="v2f-pl-orgdept${faded ? " faded" : ""}"><p class="dh">${esc(d.dept ?? "Department")}</p>${(d.members || []).map((m) => orgPill(m)).join("")}</div>`;
const orgSide = (depts, head, faded) => `<div class="v2f-pl-orgsidewrap">
  ${head ? `<p class="v2f-pl-orghead">${esc(head)}</p>` : ""}
  <div class="v2f-pl-orgside">${depts.map((d) => orgDept(d, faded)).join("")}</div>
</div>`;
/** { left:[{dept,members}], leftHead, core:{title,left,functions,right}, right:[{dept,members}], rightHead, notes:[a,b,c] } */
export const plOrgChart = ({ left = [], leftHead, core = {}, right = [], rightHead, notes = [] } = {}) => `
  <div class="v2f-pl-org reveal">
    <div class="v2f-pl-orgmain">
      ${orgSide(left, leftHead, false)}
      <div class="v2f-pl-orgcore">
        <p class="ch">${esc(core.title ?? "Core team")}</p>
        <div class="v2f-pl-orgcorerow">
          <div class="col">${(core.left || []).map((m) => orgPill(m)).join("")}</div>
          <div class="col fns">${(core.functions || []).map((f) => `<div class="v2f-pl-orgfn">${esc(f)}</div>`).join("")}</div>
          <div class="col">${(core.right || []).map((m) => orgPill(m, "faded")).join("")}</div>
        </div>
      </div>
      ${orgSide(right, rightHead, true)}
    </div>
    <div class="v2f-pl-orgnotes">${notes.map((nt) => `<p>${esc(nt)}</p>`).join("")}</div>
  </div>`;

/* ---- proposition cards, one active (data-05) ---------------------------- */
export const plCards = (cards = []) =>
  `<div class="v2f-pl-cards reveal">${cards
    .map((c) => `<div class="v2f-pl-card${c.active ? " active" : ""}">
      ${c.title ? `<p class="hd">${esc(c.title)}</p>` : ""}
      ${(c.items || []).length ? `<ul class="bl">${c.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    </div>`)
    .join("")}</div>`;
