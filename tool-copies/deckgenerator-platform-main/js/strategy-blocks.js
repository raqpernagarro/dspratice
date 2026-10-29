// =============================================================================
// Shared content blocks for the v2 "strategy" templates — the reusable pieces the
// Figma "Strategy" master (node 109:8784) is built from: split heads, proposition /
// objective card walls, a 2×2 strategy-map quadrant, phase + framework tables, a
// multi-line allocation chart, a tiered pyramid, growing-box timelines, and (batch 2)
// the concentric-circle / Venn / methodology diagrams. All hand-built in CSS/SVG —
// no chart library. Keeps the template modules thin. CSS lives in css/primitives.css
// under the .v2f-st-* namespace. Reuses the shared chrome (frame.js) + brand tokens.
// =============================================================================
import { esc } from "./components.js";
import { chartRange } from "./chart-scale.js";
import { topBar } from "./frame.js";

/* ---- heads -------------------------------------------------------------- */
/** Split head: left caption/title/subtitle heading + an optional right body
 *  paragraph (grid-01 outlook, grid-02 objectives). Left-only when no body. */
export const stSplitHead = ({ caption, title, subtitle, body } = {}) => `
  <div class="v2f-st-head reveal">
    <div class="v2f-st-headL">
      ${caption ? `<p class="v2f-caption">${esc(caption)}</p>` : ""}
      ${title ? `<p class="v2f-title">${esc(title)}</p>` : ""}
      ${subtitle ? `<p class="v2f-subtitle">${esc(subtitle)}</p>` : ""}
    </div>
    ${body ? `<p class="v2f-st-headbody">${esc(body)}</p>` : ""}
  </div>`;

/** Eyebrow caption over a bold display title (data-02 map, data-03 framework). */
export const stBoldHead = ({ caption, title } = {}) => `
  <div class="v2f-st-head reveal">
    <div class="v2f-st-headL">
      ${caption ? `<p class="v2f-caption">${esc(caption)}</p>` : ""}
      ${title ? `<p class="v2f-st-boldtitle">${esc(title)}</p>` : ""}
    </div>
  </div>`;

/* ---- card walls (cover propositions, grid-02 objectives) ---------------- */
/** A row of text cards. Each card: { title, items:[], active }. `marker` picks the
 *  bullet glyph ("disc" or "chevron"); an `active` card renders on a dark tile. */
export const stCards = (cards = [], { marker = "disc" } = {}) =>
  `<div class="v2f-st-cards">${cards
    .map((c) => {
      const items = (c.items || [])
        .map((t) => `<li>${esc(t)}</li>`)
        .join("");
      return `<div class="v2f-st-card${c.active ? " active" : ""} mk-${marker}">
        ${c.title ? `<p class="hd">${esc(c.title)}</p>` : ""}
        ${items ? `<ul class="bl">${items}</ul>` : ""}
      </div>`;
    })
    .join("")}</div>`;

/* ---- 2×2 strategy map with a centre pill (data-02) ---------------------- */
/** quadrants = [{ label, text }] in reading order (TL, TR, BL, BR); centre = pill text. */
export const stQuadrant = ({ center = "", quadrants = [] } = {}) => {
  const cells = quadrants
    .map((q) => `<div class="v2f-st-quad">
      ${q.label ? `<p class="ql">${esc(q.label)}</p>` : ""}
      ${q.text ? `<p class="qt">${esc(q.text)}</p>` : ""}
    </div>`)
    .join("");
  return `<div class="v2f-st-mapwrap reveal">
    <div class="v2f-st-map">${cells}
      <span class="v2f-st-vline"></span><span class="v2f-st-hline"></span>
      ${center ? `<div class="v2f-st-pill">${esc(center)}</div>` : ""}
    </div>
  </div>`;
};

/* ---- phase timeline table (grid-03) ------------------------------------- */
/** A dotted phase axis header (n phase columns) over a row×phase text table.
 *  phases = [string]; rows = [{ label, cells:[string] }]. */
export const stPhaseTable = ({ phases = [], rows = [] } = {}) => {
  const heads = phases
    .map((p) => `<div class="v2f-st-ph"><span class="pt">${esc(p)}</span><span class="dot"></span></div>`)
    .join("");
  const body = rows
    .map((r) => `<div class="v2f-st-prow">
      <div class="v2f-st-pc lk">${esc(r.label ?? "")}</div>
      ${(r.cells || []).map((c) => `<div class="v2f-st-pc">${esc(c)}</div>`).join("")}
    </div>`)
    .join("");
  return `<div class="v2f-st-phase reveal">
    <div class="v2f-st-phhead"><div class="v2f-st-pc lk"></div>${heads}<span class="v2f-st-axis"></span></div>
    <div class="v2f-st-ptable">${body}</div>
  </div>`;
};

/* ---- framework table with variable column spans (data-03) --------------- */
/** rows = [{ label, cells:[string], grow?:number, small?:bool }]. A row with one
 *  cell spans the whole value area; more cells split it evenly. `small` renders a
 *  dense strip of tiny cells (the "Topics" row). `grow` weights the row height. */
export const stFramework = ({ rows = [] } = {}) => {
  const body = rows
    .map((r) => {
      const cells = (r.cells || [])
        .map((c) =>
          c && typeof c === "object"
            ? `<div class="v2f-st-fc col">${c.title ? `<p class="ct">${esc(c.title)}</p>` : ""}${c.text ? `<p class="cb">${esc(c.text)}</p>` : ""}</div>`
            : `<div class="v2f-st-fc">${esc(c)}</div>`
        )
        .join("");
      const cls = `${r.small ? " small" : ""}`;
      return `<div class="v2f-st-frow${cls}" style="flex:${r.grow ?? 1} 1 0">
        <div class="v2f-st-fc lk">${esc(r.label ?? "")}</div>
        <div class="v2f-st-fvals">${cells}</div>
      </div>`;
    })
    .join("");
  return `<div class="v2f-st-fwrap reveal"><div class="v2f-st-framework">${body}</div></div>`;
};

/* ---- side text column (grid-04..11 splits) ------------------------------ */
/** The narrow text column beside a diagram/chart. `legend` = [{ label, style }]
 *  where style ∈ dashed|solid|bold draws a line-style key (grid-04). `blocks` =
 *  [{ label, text }] renders labelled paragraph blocks (grid-05 golden circle). */
export const stTextCol = ({ meta, caption, title, subtitle, legend, body, blocks, side = "left" } = {}) => `
  <div class="v2f-st-col ${side}">
    ${topBar(meta)}
    <div class="v2f-st-coptext">
      <div class="v2f-st-colhead">
        ${caption ? `<p class="v2f-caption">${esc(caption)}</p>` : ""}
        ${title ? `<p class="v2f-title">${esc(title)}</p>` : ""}
        ${subtitle ? `<p class="v2f-subtitle">${esc(subtitle)}</p>` : ""}
      </div>
      ${Array.isArray(legend) && legend.length ? stLineLegend(legend) : ""}
      ${Array.isArray(blocks) && blocks.length
        ? `<div class="v2f-st-blocks">${blocks.map((b) => `<div class="v2f-st-block"><p class="bl-h">${esc(b.label ?? "")}</p><p class="bl-b">${esc(b.text ?? "")}</p></div>`).join("")}</div>`
        : ""}
      ${Array.isArray(body) && body.length
        ? `<div class="v2f-st-bodytext">${body.map((t) => `<p>${esc(t)}</p>`).join("")}</div>`
        : ""}
    </div>
  </div>`;

/** Line-style legend (dashed / solid / bold strokes) for the allocation chart. */
export const stLineLegend = (items = []) =>
  `<div class="v2f-st-linelegend">${items
    .map((it) => `<div class="v2f-st-llrow"><span class="ln ${esc(it.style || "solid")}"></span>${esc(it.label ?? "")}</div>`)
    .join("")}</div>`;

/* ---- multi-line allocation chart with phase dividers (grid-04) ---------- */
/** series = [{ values:[y…], dashed, bold, points:[{label}] }] with y in data units,
 *  evenly spaced across the plot. yTicks = [{ value, label }]; xTicks/phases =
 *  [{ at:0..1, label }] (phases draw a vertical divider + top label). */
export const stLineChart = ({ series = [], yTicks = [], xTicks = [], phases = [], max = null } = {}) => {
  const W = 1200, H = 860, gL = 96, gR = 40, gT = 40, gB = 56;
  const pw = W - gL - gR, ph = H - gT - gB;
  /* Fitted, not zero-based against the template's own ceiling — the same bug
   * finLineChart had, in a second family. strategy/allocation declares
   * max:5600, and a deck plotting a percentage series beside it stacked "0",
   * "6%", "12%" and "18%" on top of each other at the foot of the axis. Shared
   * so the two cannot drift again; see js/chart-scale.js. */
  const allVals = series.flatMap((s) => s.values || []).filter((v) => Number.isFinite(+v));
  const tickVals = yTicks.map((t) => +t.value).filter((v) => Number.isFinite(v));
  const { lo, hi } = chartRange(allVals, tickVals, max);
  const X = (f) => gL + f * pw;
  const Xi = (i, n) => X(n <= 1 ? 0.5 : i / (n - 1));
  const Y = (v) => gT + (1 - ((Number.isFinite(+v) ? +v : lo) - lo) / (hi - lo)) * ph;
  const axisY = `<line x1="${gL}" y1="${gT}" x2="${gL}" y2="${gT + ph}" stroke="#010716" stroke-width="1.5"/>`;
  const axisX = `<line x1="${gL}" y1="${gT + ph}" x2="${W - gR}" y2="${gT + ph}" stroke="#010716" stroke-width="1.5"/>
    <path d="M${W - gR - 12},${gT + ph - 7} L${W - gR},${gT + ph} L${W - gR - 12},${gT + ph + 7}" fill="none" stroke="#010716" stroke-width="1.5"/>`;
  const yt = yTicks
    .map((t) => `<text x="${gL - 18}" y="${(Y(+t.value) + 7).toFixed(1)}" text-anchor="end" font-size="22" font-weight="500" fill="#010716">${esc(t.label)}</text>`)
    .join("");
  const dividers = phases
    .map((p) => `<line x1="${X(p.at).toFixed(1)}" y1="${gT}" x2="${X(p.at).toFixed(1)}" y2="${gT + ph}" stroke="rgba(1,7,22,.28)" stroke-width="1"/>
      ${p.label ? `<text x="${X(p.at).toFixed(1)}" y="${gT - 12}" text-anchor="middle" font-size="20" font-weight="500" fill="#010716">${esc(p.label)}</text>` : ""}`)
    .join("");
  const xt = xTicks
    .map((t) => `<text x="${X(t.at).toFixed(1)}" y="${H - 16}" text-anchor="middle" font-size="20" font-weight="500" fill="#010716">${esc(t.label)}</text>`)
    .join("");
  const lines = series
    .map((s) => {
      const n = (s.values || []).length;
      const pts = (s.values || []).map((v, i) => `${Xi(i, n).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
      const dash = s.dashed ? `stroke-dasharray="8 8"` : "";
      const w = s.bold ? 3 : 1.75;
      const stroke = s.color || "#010716";
      const labels = (s.points || [])
        .map((p, i) => (p && p.label != null ? `<text x="${Xi(i, n).toFixed(1)}" y="${(Y(s.values[i]) + 34).toFixed(1)}" text-anchor="middle" font-size="20" font-weight="500" fill="#010716">${esc(p.label)}</text>` : ""))
        .join("");
      return `<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="${w}" ${dash}/>${labels}`;
    })
    .join("");
  return `<svg class="v2f-st-svg" viewBox="0 0 ${W} ${H}"><text x="${gL - 18}" y="${gT - 12}" text-anchor="end" font-size="22" font-weight="500" fill="#010716">$</text>${axisY}${axisX}${dividers}${yt}${xt}${lines}</svg>`;
};

/* ---- tiered pyramid (grid-11) ------------------------------------------- */
/** A dark triangle split into n horizontal tiers (top→bottom), each labelled. */
export const stPyramid = (tiers = []) => {
  const W = 900, H = 820, n = tiers.length || 1;
  const apex = [W / 2, 8], bl = [40, H - 8], br = [W - 40, H - 8];
  const gap = 10;
  const bandH = (H - 16) / n;
  const edgeX = (y, side) => {
    const t = (y - apex[1]) / (bl[1] - apex[1]); // 0 at apex, 1 at base
    return side === "l" ? apex[0] + (bl[0] - apex[0]) * t : apex[0] + (br[0] - apex[0]) * t;
  };
  const bands = tiers
    .map((tt, i) => {
      const y0 = apex[1] + i * bandH + (i ? gap / 2 : 0);
      const y1 = apex[1] + (i + 1) * bandH - gap / 2;
      const lx0 = edgeX(y0, "l"), rx0 = edgeX(y0, "r");
      const lx1 = edgeX(y1, "l"), rx1 = edgeX(y1, "r");
      const poly = `${lx0.toFixed(1)},${y0.toFixed(1)} ${rx0.toFixed(1)},${y0.toFixed(1)} ${rx1.toFixed(1)},${y1.toFixed(1)} ${lx1.toFixed(1)},${y1.toFixed(1)}`;
      const cy = (y0 + y1) / 2;
      const label = tt.label ?? tt;
      return `<polygon points="${poly}" fill="var(--fin-card-dark,#3a3f4a)"/>
        <text x="${W / 2}" y="${(cy + 8).toFixed(1)}" text-anchor="middle" font-size="24" font-weight="500" fill="#fff">${esc(label)}</text>`;
    })
    .join("");
  return `<div class="v2f-st-diagram reveal"><svg class="v2f-st-svg" viewBox="0 0 ${W} ${H}">${bands}</svg></div>`;
};

/* ---- concentric circles (grid-05 golden circle, grid-08 collaborators) --- */
/** labels[0] = innermost. `mode:"axis"` places ring labels along the +x centre
 *  line (golden circle); `mode:"bottom"` stacks them below centre (collaborators).
 *  `centerLabel` prints a bold word in the middle circle. */
export const stConcentric = ({ labels = [], mode = "axis", centerLabel = "" } = {}) => {
  const S = 900, cx = S / 2, cy = S / 2;
  const n = labels.length || 1;
  const rInner = 96, rOuter = 434;
  const radii = labels.map((_, i) => rInner + (rOuter - rInner) * (i / (n - 1 || 1)));
  const circles = radii
    .slice()
    .reverse()
    .map((r, idx) => {
      const depth = n - 1 - idx; // 0 outermost … n-1 innermost
      const fill = `rgba(1,7,22,${(0.03 + depth * 0.02).toFixed(3)})`;
      return `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${fill}" stroke="#6b7280" stroke-width="1"/>`;
    })
    .join("");
  let text = centerLabel
    ? `<text x="${cx}" y="${cy + 9}" text-anchor="middle" font-size="30" font-weight="500" fill="#010716">${esc(centerLabel)}</text>`
    : "";
  labels.forEach((lb, i) => {
    if (!lb) return;
    if (mode === "axis") {
      const r0 = i === 0 ? 0 : radii[i - 1];
      const x = cx + (i === 0 ? 0 : (r0 + radii[i]) / 2);
      text += `<text x="${x.toFixed(1)}" y="${cy + 9}" text-anchor="middle" font-size="26" font-weight="500" fill="#010716">${esc(lb)}</text>`;
    } else {
      const r0 = i === 0 ? 0 : radii[i - 1];
      const y = cy + (i === 0 ? 0 : (r0 + radii[i]) / 2);
      text += `<text x="${cx}" y="${y.toFixed(1)}" text-anchor="middle" font-size="22" font-weight="500" fill="#010716">${esc(lb)}</text>`;
    }
  });
  return `<div class="v2f-st-diagram reveal"><svg class="v2f-st-svg" viewBox="0 0 ${S} ${S}">${circles}${text}</svg></div>`;
};

/* ---- bottom-nested onion (grid-07) -------------------------------------- */
/** items[0] = outermost/largest. Circles share a bottom tangent + vertical axis
 *  and shrink; each is labelled (title + text) near its top arc. */
export const stOnionOffset = (items = []) => {
  const S = 900, cx = S / 2, bottomY = 872, n = items.length || 1;
  const rMax = 434, rMin = 150;
  const rings = items.map((_, i) => rMax - (rMax - rMin) * (i / (n - 1 || 1)));
  const circles = rings
    .map((r, i) => `<circle cx="${cx}" cy="${(bottomY - r).toFixed(1)}" r="${r.toFixed(1)}" fill="rgba(1,7,22,0.045)" stroke="#c0c5cd" stroke-width="1"/>`)
    .join("");
  const labels = items
    .map((it, i) => {
      const topY = bottomY - 2 * rings[i];
      const ty = topY + 52;
      const title = it.title != null ? `<text x="${cx}" y="${ty}" text-anchor="middle" font-size="24" font-weight="500" fill="#010716">${esc(it.title)}</text>` : "";
      const t = it.text || "";
      const lines = String(t).match(/.{1,34}(\s|$)/g) || [t];
      const body = lines
        .slice(0, 2)
        .map((ln, k) => `<text x="${cx}" y="${ty + 34 + k * 26}" text-anchor="middle" font-size="19" font-weight="500" fill="rgba(1,7,22,.5)">${esc(ln.trim())}</text>`)
        .join("");
      return title + body;
    })
    .join("");
  return `<div class="v2f-st-diagram reveal"><svg class="v2f-st-svg" viewBox="0 0 ${S} ${S}">${circles}${labels}</svg></div>`;
};

/* ---- 3-circle Venn with a centre reuleaux (grid-09) --------------------- */
/** labels = [top, bottomLeft, bottomRight] outside the circles; `center` fills the
 *  central reuleaux triangle. */
export const stVenn = ({ labels = [], center = "" } = {}) => {
  // The three centres sit d above / d·sin30° below cy, so the figure spans
  // cy-d-R … cy+d/2+R. cy = S/2 + d/4 puts that span in the middle of the box
  // (it was 442, which clipped the top circle and left the diagram sitting high).
  const S = 900, cx = S / 2, R = 292, d = 164, cy = S / 2 + d / 4;
  const rad = (deg) => (deg * Math.PI) / 180;
  const dirs = [-90, 30, 150]; // A: top, B: bottom-right, C: bottom-left
  const [CA, CB, CC] = dirs.map((a) => [cx + d * Math.cos(rad(a)), cy + d * Math.sin(rad(a))]);
  const circles = [CA, CB, CC]
    .map((c) => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${R}" fill="none" stroke="#b7bcc6" stroke-width="1"/>`)
    .join("");
  // inner (closest-to-centre) intersection of two equal circles
  const inner = (c1, c2) => {
    const mx = (c1[0] + c2[0]) / 2, my = (c1[1] + c2[1]) / 2;
    const dx = c2[0] - c1[0], dy = c2[1] - c1[1], L = Math.hypot(dx, dy);
    const h = Math.sqrt(Math.max(0, R * R - (L / 2) ** 2));
    const ux = -dy / L, uy = dx / L;
    const p1 = [mx + h * ux, my + h * uy], p2 = [mx - h * ux, my - h * uy];
    return Math.hypot(p1[0] - cx, p1[1] - cy) < Math.hypot(p2[0] - cx, p2[1] - cy) ? p1 : p2;
  };
  const vTop = inner(CB, CC), vBR = inner(CA, CC), vBL = inner(CA, CB);
  // sample the minor arc of circle `C` from P to Q (the region-boundary arc)
  const arc = (C, P, Q, n = 20) => {
    let aP = Math.atan2(P[1] - C[1], P[0] - C[0]);
    let aQ = Math.atan2(Q[1] - C[1], Q[0] - C[0]);
    let diff = aQ - aP;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const pts = [];
    for (let i = 1; i <= n; i++) {
      const a = aP + diff * (i / n);
      pts.push(`${(C[0] + R * Math.cos(a)).toFixed(1)},${(C[1] + R * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const reuleaux = `M${vTop[0].toFixed(1)},${vTop[1].toFixed(1)} L${arc(CC, vTop, vBR)} L${arc(CA, vBR, vBL)} L${arc(CB, vBL, vTop)} Z`;
  const my = cy;
  const labelR = d + R * 0.52;
  const labelPos = dirs.map((a) => [cx + labelR * Math.cos(rad(a)), cy + labelR * Math.sin(rad(a)) + (a === -90 ? 0 : 8)]);
  const labs = labels
    .map((l, i) => (l ? `<text x="${labelPos[i][0].toFixed(1)}" y="${labelPos[i][1].toFixed(1)}" text-anchor="middle" font-size="24" font-weight="500" fill="#010716">${esc(l)}</text>` : ""))
    .join("");
  return `<div class="v2f-st-diagram reveal"><svg class="v2f-st-svg" viewBox="0 0 ${S} ${S}">
    <defs><linearGradient id="stVenn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3f4a"/><stop offset="1" stop-color="#9aa0ab"/></linearGradient></defs>
    ${circles}<path d="${reuleaux}" fill="url(#stVenn)"/>
    <text x="${cx}" y="${(my + 6).toFixed(1)}" text-anchor="middle" font-size="24" font-weight="500" fill="#fff">${esc(center)}</text>
    ${labs}</svg></div>`;
};

/* ---- nodes around a dashed ring (grid-10 methodology) ------------------- */
/** nodes = [string] placed clockwise from the top on a dashed circle. */
export const stMethodology = (nodes = []) => {
  const S = 900, cx = S / 2, cy = S / 2, R = 300, nr = 52, n = nodes.length || 1;
  const ring = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#010716" stroke-width="1.5" stroke-dasharray="3 7"/>`;
  const els = nodes
    .map((lb, i) => {
      const a = -Math.PI / 2 + (i / n) * 2 * Math.PI;
      const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${nr}" fill="#010716"/>
        <text x="${x.toFixed(1)}" y="${(y + 7).toFixed(1)}" text-anchor="middle" font-size="22" font-weight="500" fill="#fff">${esc(lb)}</text>`;
    })
    .join("");
  return `<div class="v2f-st-diagram reveal"><svg class="v2f-st-svg" viewBox="0 0 ${S} ${S}">${ring}${els}</svg></div>`;
};

/* ---- bipolar attribute sliders (grid-06) -------------------------------- */
/** rows = [{ left, right, value:0..1 }] — a dot on a track between two poles. */
export const stSliders = (rows = []) =>
  `<div class="v2f-st-sliderpanel reveal">${rows
    .map((r) => `<div class="v2f-st-sliderrow">
      <span class="pl">${esc(r.left ?? "")}</span>
      <span class="track"><span class="dot" style="left:${Math.max(0, Math.min(1, r.value ?? 0.5)) * 100}%"></span></span>
      <span class="pr">${esc(r.right ?? "")}</span>
    </div>`)
    .join("")}</div>`;

/* ---- month timeline (grid-12 projection footer) ------------------------- */
/** months = [{ label, text, active }] on a horizontal arrowed axis. */
export const stMonthTimeline = (months = []) =>
  `<div class="v2f-st-months"><div class="v2f-st-monthaxis"></div>
    ${months
      .map((m) => `<div class="v2f-st-month">
        <span class="dot${m.active ? " active" : ""}"></span>
        <p class="mh">${esc(m.label ?? "")}</p>
        <p class="mb">${esc(m.text ?? "")}</p>
      </div>`)
      .join("")}</div>`;

/* ---- upward projection curve → bullets (grid-12) ------------------------ */
export const stProjectionChart = ({ name = "", bullets = [] } = {}) => {
  const items = bullets.map((b) => `<li>${esc(b)}</li>`).join("");
  return `<div class="v2f-st-projwrap reveal">
    <div class="v2f-st-namebox">${esc(name)}</div>
    <svg class="v2f-st-projsvg" viewBox="0 0 1600 520" preserveAspectRatio="none">
      <path d="M40,470 C520,450 1040,360 1470,84" fill="none" stroke="#010716" stroke-width="2"/>
      <polygon points="1480,70 1449,88 1470,101" fill="#010716"/>
    </svg>
    <ul class="v2f-st-projbullets">${items}</ul>
  </div>`;
};

/* ---- ascending target staircase grid (grid-13) -------------------------- */
/** cards = [string] filled step labels (bottom-left → top-right); ticks = axis
 *  labels (cards.length + 1). Cells above the diagonal are light placeholders. */
export const stTargets = ({ cards = [], ticks = [] } = {}) => {
  const n = cards.length || 1;
  let grid = "";
  for (let r = n - 1; r >= 0; r--) {
    for (let c = 0; c < n; c++) {
      if (c < r) grid += `<div class="v2f-st-tcell empty"></div>`;
      else if (c === r) grid += `<div class="v2f-st-tcell fill">${esc(cards[r])}</div>`;
      else grid += `<div class="v2f-st-tcell light"></div>`;
    }
  }
  const axis = `<div class="v2f-st-taxis"></div>`;
  const tickEls = `<div class="v2f-st-tticks">${ticks
    .map((t) => `<span>${esc(t)}</span>`)
    .join("")}</div>`;
  return `<div class="v2f-st-targets reveal">
    <div class="v2f-st-tgrid" style="grid-template-columns:repeat(${n},1fr);grid-template-rows:repeat(${n},1fr)">${grid}</div>
    ${axis}${tickEls}
  </div>`;
};

/* ---- growing-box timeline (grid-01 outlook) ----------------------------- */
/** items = [string] labels; boxes grow left→right, vertical grey gradient, the
 *  first (nearest) rendered on the darkest tile. */
export const stGrowBoxes = (items = []) => {
  const n = items.length || 1;
  const min = 150, max = 460;
  const boxes = items
    .map((label, i) => {
      const sz = n <= 1 ? max : min + ((max - min) * i) / (n - 1);
      return `<div class="v2f-st-gbox${i === 0 ? " first" : ""}" style="width:${sz.toFixed(0)}px;height:${sz.toFixed(0)}px">
        <span>${esc(label)}</span>
      </div>`;
    })
    .join("");
  return `<div class="v2f-st-grow reveal">${boxes}</div>`;
};
