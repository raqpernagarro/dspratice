// =============================================================================
// Shared content blocks for the v2 "finance" templates — the reusable pieces
// that the Figma "Finance" master is built from (stat / highlight cards, big-number
// statement heads, hand-built CSS/SVG charts, proportion bars, dot-waffles, dense
// data tables). Keeps the template modules thin. All charts are schema-driven:
// a deck supplies the numbers and these blocks draw the bars / line / dots.
// CSS lives in css/primitives.css under the .v2f-fin-* namespace.
// =============================================================================
import { esc } from "./components.js";
import { chartRange } from "./chart-scale.js";
import { topBar } from "./frame.js";

/* ---- big-number statement head (grid-04/05, split-01/02) ---------------- */
/** Eyebrow caption + a large display statement, with an optional right-side intro. */
export const finHead = ({ caption, statement, intro } = {}) => `
  <div class="v2f-fin-head reveal">
    ${caption ? `<p class="v2f-caption">${esc(caption)}</p>` : ""}
    <div class="v2f-fin-headrow">
      ${statement ? `<p class="v2f-fin-statement">${esc(statement).replace(/\n/g, "<br>")}</p>` : ""}
      ${intro ? `<p class="v2f-fin-intro">${esc(intro)}</p>` : ""}
    </div>
  </div>`;

/** A small centred caption line under a chart (escaped). */
export const finCaption = (text) =>
  text ? `<p class="v2f-fin-cap">${esc(text)}</p>` : "";

/* ---- highlights / stat card wall (grid-03) ------------------------------ */
/** One card: a quote (+source) OR a big stat (+trend arrow), on a dark or grey tile. */
export const finCard = (c = {}) => {
  const tone = c.tone === "grey" ? "grey" : "dark";
  const isStat = c.stat != null;
  const tri = c.trend === "up" ? `<span class="tri">▲</span>`
    : c.trend === "down" ? `<span class="tri">▼</span>` : "";
  const body = isStat
    ? `<p class="stat">${tri}<span>${esc(c.stat)}</span></p>`
    : `<p class="quote">${esc(c.quote ?? "")}</p>`;
  const src = c.source ? `<p class="src">${esc(c.source)}</p>` : "";
  return `<div class="v2f-fin-card ${tone}" style="flex:${c.grow ?? 1} 1 0">${body}${src}</div>`;
};

/** A column of finance cards (each card carries its own `grow` weight). */
export const finCardCol = (cards = []) =>
  `<div class="v2f-fin-wcol">${cards.map(finCard).join("")}</div>`;

/* ---- statement list (grid-02) ------------------------------------------- */
/** A centred stack of triangle-bulleted display statements. */
export const finStatementList = (items = []) =>
  `<div class="v2f-fin-listcol">${items
    .map((t) => `<p class="v2f-fin-litem">${esc(t)}</p>`)
    .join("")}</div>`;

/* ---- vertical bar chart (grid-05 = value above; grid-16 = value inside) --- */
/** `inside` bars leave headroom above the tallest bar for an annotation bracket.
 *  `bracket` = { from, to, text } draws a dashed growth bracket between two bars. */
export const finBars = (bars = [], { inside = false, bracket = null } = {}) => {
  const max = Math.max(...bars.map((b) => +b.value || 0), 1);
  const scale = inside ? 0.8 : 1; // headroom above the tallest bar for annotations
  const cols = bars
    .map((b) => {
      const h = Math.max(2, ((+b.value || 0) / max) * 100 * scale);
      const val = `<p class="val">${esc(b.display ?? b.value ?? "")}</p>`;
      return inside
        ? `<div class="v2f-fin-bar inside"><div class="col" style="height:${h}%">${val}</div></div>`
        : `<div class="v2f-fin-bar">${val}<div class="col" style="height:${h}%"></div></div>`;
    })
    .join("");
  const overlay = bracket ? finBracket(bars, max, scale, bracket) : "";
  const axis = `<div class="v2f-fin-axis">${bars
    .map((b) => `<span>${esc(b.label ?? "")}</span>`)
    .join("")}</div>`;
  return `<div class="v2f-fin-bars">${cols}${overlay}</div>${axis}`;
};

/** A dashed "growth" bracket: up from bar `from`'s top, across, down to bar `to`'s
 *  top, with a label centred above — positioned in % of the bars area. */
const finBracket = (bars, max, scale, { from = 0, to = 0, text = "" } = {}) => {
  const n = bars.length || 1;
  const cx = (i) => ((i + 0.5) / n) * 100; // bar centre, x %
  const topY = (i) => 100 - ((+bars[i]?.value || 0) / max) * 100 * scale; // bar top, y %
  const xF = cx(from), xT = cx(to), yF = topY(from), yT = topY(to);
  const yTop = Math.max(2, Math.min(yF, yT) - 12);
  const xL = Math.min(xF, xT), xR = Math.max(xF, xT);
  return `<div class="v2f-fin-bracket">
    <div class="top" style="left:${xL}%;width:${xR - xL}%;top:${yTop}%"></div>
    <div class="leg" style="left:${xF}%;top:${yTop}%;height:${Math.max(0, yF - yTop)}%"></div>
    <div class="leg" style="left:${xT}%;top:${yTop}%;height:${Math.max(0, yT - yTop)}%"></div>
    ${text ? `<div class="lab" style="left:${(xF + xT) / 2}%;top:${yTop}%">${esc(text)}</div>` : ""}
  </div>`;
};

/* ---- horizontal stacked proportion bar + legend (split-01) -------------- */
const SEG_TONES = [
  "var(--fin-seg-1)", "var(--fin-seg-2)", "var(--fin-seg-3)", "var(--fin-seg-4)",
];
export const finProportion = ({ legend = [], segments = [] } = {}) => {
  const total = segments.reduce((s, x) => s + (+x.value || 0), 0) || 1;
  const leg = legend
    .map((l, i) => `<div class="v2f-fin-legrow"><span class="dot" style="background:${SEG_TONES[i % 4]}"></span>${esc(l)}</div>`)
    .join("");
  const segs = segments
    .map((s, i) => `<div class="seg" style="width:${((+s.value || 0) / total) * 100}%;background:${SEG_TONES[i % 4]}"></div>`)
    .join("");
  return `<div class="v2f-fin-legend">${leg}</div><div class="v2f-fin-propbar">${segs}</div>`;
};

/* ---- dot-waffle card (split-02) ----------------------------------------- */
export const finWaffleCard = ({ label, count = 0 } = {}) => {
  const dots = Array.from({ length: Math.max(0, count) }, () => "<i></i>").join("");
  return `<div class="v2f-fin-dotcard">
    ${label ? `<p class="lbl">${esc(label)}</p>` : ""}
    <div class="v2f-fin-waffle">${dots}</div>
  </div>`;
};

/* ---- disclaimer / fine-print panel (grid-01) ---------------------------- */
export const finDisclaimer = (sections = []) =>
  `<div class="v2f-fin-discl-panel">${sections
    .map((s) => `<div class="v2f-fin-discl-sec"><p class="lb">${esc(s.label ?? "")}</p><p class="bd">${esc(s.body ?? "")}</p></div>`)
    .join("")}</div>`;

/* ---- dense data table (data-03) ----------------------------------------- */
/** Dense data table. `align`: "right" (default) or "center" for value cells.
 *  A row may set `total:true` (dark summary band) or `summary:true` (bold label). */
export const finTable = ({ columns = [], rows = [], align = "right", labelHead = "", hug = false } = {}) => {
  const head = `<div class="v2f-fin-trow head"><div class="v2f-fin-tc lk">${esc(labelHead)}</div>${columns
    .map((c) => `<div class="v2f-fin-tc">${esc(c)}</div>`)
    .join("")}</div>`;
  const body = rows
    .map((r) => {
      const cls = r.total ? " total" : r.summary ? " summary" : "";
      const cells = (r.cells || []).map((c) => `<div class="v2f-fin-tc">${esc(c)}</div>`).join("");
      return `<div class="v2f-fin-trow${cls}"><div class="v2f-fin-tc lk">${esc(r.label ?? "")}</div>${cells}</div>`;
    })
    .join("");
  // hug: table height wraps its rows (no filler); otherwise it fills the slide.
  const cls = `${align === "center" ? " center" : ""}${hug ? " hug" : ""}`;
  return `<div class="v2f-fin-table${cls}">${head}${body}${hug ? "" : `<div class="fill"></div>`}</div>`;
};

/* ---- area / line chart (grid-04) ---------------------------------------- */
/** A filled area chart with point value labels above and an X axis below.
 *  Drawn as inline SVG in a 1792×760 viewBox (720 plot + 40 axis strip). */
export const finArea = (points = []) => {
  const W = 1792, H = 700, AX = 60, PAD_TOP = 40;
  const max = Math.max(...points.map((p) => +p.value || 0), 1);
  const n = points.length;
  const px = (i) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const py = (v) => PAD_TOP + (1 - (v || 0) / max) * (H - PAD_TOP);
  const pts = points.map((p, i) => [px(i), py(+p.value || 0)]);
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${pts[0][0].toFixed(1)},${H} ${line} ${pts[n - 1][0].toFixed(1)},${H}`;
  const valLabels = points
    .map((p, i) => `<text x="${pts[i][0].toFixed(1)}" y="${(pts[i][1] - 18).toFixed(1)}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}" font-size="26" font-weight="500" fill="${i === n - 1 ? "#010716" : "rgba(1,7,22,.5)"}">${esc(p.value ?? "")}</text>`)
    .join("");
  const axisLabels = points
    .map((p, i) => `<text x="${pts[i][0].toFixed(1)}" y="${H + 34}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}" font-size="18" font-weight="500" fill="#010716">${esc(p.label ?? "")}</text>`)
    .join("");
  return `<div class="v2f-fin-svgwrap reveal"><svg class="v2f-fin-svg" viewBox="0 0 ${W} ${H + AX}">
    <defs>
      <linearGradient id="finArea" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#f4f5f6"/>
        <stop offset="1" stop-color="#aab0b9"/>
      </linearGradient>
      <linearGradient id="finAreaLine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#b7bcc6"/>
        <stop offset="1" stop-color="#3a3f4a"/>
      </linearGradient>
    </defs>
    <polygon points="${area}" fill="url(#finArea)"/>
    <line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="#010716" stroke-width="2"/>
    ${valLabels}${axisLabels}
  </svg></div>`;
};

/* ---- bold eyebrow + title head (full-width chart / table slides) -------- */
export const finBoldHead = ({ caption, title } = {}) => `
  <div class="v2f-fin-head reveal"><div class="v2f-fin-headmain">
    ${caption ? `<p class="v2f-caption">${esc(caption)}</p>` : ""}
    ${title ? `<p class="v2f-fin-tabletitle">${esc(title)}</p>` : ""}
  </div></div>`;

/* ---- legend (dots + labels), vertical or inline ------------------------- */
export const finLegend = (labels = [], { inline = false } = {}) =>
  `<div class="v2f-fin-legend${inline ? " inline" : ""}">${labels
    .map((l, i) => `<div class="v2f-fin-legrow"><span class="dot" style="background:${SEG_TONES[i % 4]}"></span>${esc(l)}</div>`)
    .join("")}</div>`;

/* ---- stacked vertical bar chart (grid-06 $ + totals, grid-07 %, grid-12) - */
export const finStackedBars = (bars = [], { showTotal = false } = {}) => {
  const totals = bars.map((b) => (b.segments || []).reduce((s, x) => s + (+x.value || 0), 0));
  const max = Math.max(...totals, 1);
  const cols = bars
    .map((b, bi) => {
      const segs = (b.segments || [])
        .map((s, si) => `<div class="seg" style="height:${((+s.value || 0) / (totals[bi] || 1)) * 100}%;background:${SEG_TONES[si % 4]}"><span>${esc(s.display ?? s.value ?? "")}</span></div>`)
        .join("");
      const tot = showTotal ? `<p class="tot">${esc(b.display ?? totals[bi])}</p>` : "";
      return `<div class="v2f-fin-sbar">${tot}<div class="stack" style="height:${(totals[bi] / max) * 100}%">${segs}</div></div>`;
    })
    .join("");
  const axis = `<div class="v2f-fin-axis">${bars.map((b) => `<span>${esc(b.label ?? "")}</span>`).join("")}</div>`;
  return `<div class="v2f-fin-sbars">${cols}</div>${axis}`;
};

/* ---- a single panelled bar chart (grid-15 / grid-16 small multiples) ----- */
export const finBarPanel = (p = {}) => `
  <div class="v2f-fin-panel">
    <div class="v2f-fin-panelhd">
      ${p.caption ? `<p class="ey">${esc(p.caption)}</p>` : ""}
      ${p.title ? `<p class="ti">${esc(p.title)}</p>` : ""}
    </div>
    ${finBars(p.bars || [], { inside: true, bracket: p.bracket || null })}
  </div>`;

/* ---- multi-line chart (grid-09 two lines, grid-13 line + markers + trend)  */
export const finLineChart = ({ series = [], yTicks = [], xLabels = [], max = null } = {}) => {
  const W = 1360, H = 740, gL = 100, gB = 56, gT = 30, gR = 30;
  const pw = W - gL - gR, ph = H - gT - gB;
  /* The axis is FITTED to the data, not fixed at zero with a hardcoded top —
   * see js/chart-scale.js for why, and for the twin of this bug in
   * stLineChart. An explicit `max` is honoured only when the data reaches into
   * it, which keeps the zero-based dollar axis the finance examples use. */
  const allVals = series.flatMap((s) => s.values || []).filter((v) => Number.isFinite(+v));
  const tickVals = yTicks.map((t) => +(t.value ?? t)).filter((v) => Number.isFinite(v));
  const { lo, hi } = chartRange(allVals, tickVals, max);
  const n = Math.max(...series.map((s) => (s.values || []).length), 1);
  const X = (i) => gL + (n <= 1 ? pw / 2 : (i / (n - 1)) * pw);
  const Y = (v) => gT + (1 - ((Number.isFinite(+v) ? +v : lo) - lo) / (hi - lo)) * ph;
  const yt = yTicks
    .map((t) => `<text x="${gL - 20}" y="${(Y(+(t.value ?? t)) + 7).toFixed(1)}" text-anchor="end" font-size="22" font-weight="500" fill="#010716">${esc(t.label ?? t)}</text>`)
    .join("");
  const xt = xLabels
    .map((l, i) => `<text x="${X(i).toFixed(1)}" y="${H - 16}" text-anchor="middle" font-size="20" font-weight="500" fill="#010716">${esc(l)}</text>`)
    .join("");
  const baseline = `<line x1="${gL}" y1="${gT + ph}" x2="${W - gR}" y2="${gT + ph}" stroke="#010716" stroke-width="1.5"/>`;
  const lines = series
    .map((s) => {
      const pts = (s.values || []).map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
      const stroke = s.color || "#3a3f4a";
      const dash = s.dashed ? `stroke-dasharray="7 7"` : "";
      const markers = s.markers
        ? (s.values || [])
            .map((v, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="8" fill="#fff" stroke="${stroke}" stroke-width="2"/>${s.markers[i]?.label != null ? `<text x="${X(i).toFixed(1)}" y="${(Y(v) - 20).toFixed(1)}" text-anchor="middle" font-size="20" font-weight="500" fill="#010716">${esc(s.markers[i].label)}</text>` : ""}`)
            .join("")
        : "";
      return `<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="${s.width || 2.5}" ${dash}/>${markers}`;
    })
    .join("");
  return `<svg class="v2f-fin-svg" viewBox="0 0 ${W} ${H}">${baseline}${yt}${xt}${lines}</svg>`;
};

/* ---- dotted-line density chart (grid-08) -------------------------------- */
export const finDottedLine = ({ points = [] } = {}) => {
  const W = 1360, H = 740, gL = 40, gB = 56, gT = 48, gR = 40;
  const pw = W - gL - gR, ph = H - gT - gB;
  const vals = points.map((p) => +p.value || 0);
  const hi = Math.max(...vals, 1), lo = Math.min(...vals, 0);
  const pad = (hi - lo) * 0.6 || 1;
  const mx = hi + pad, mn = lo - pad;
  const n = points.length || 1;
  const X = (i) => gL + (n <= 1 ? pw / 2 : (i / (n - 1)) * pw);
  const Y = (v) => gT + (1 - (v - mn) / ((mx - mn) || 1)) * ph;
  let dots = "";
  const D = 64;
  for (let d = 0; d <= D; d++) {
    const t = (d / D) * (n - 1);
    const i0 = Math.floor(t), i1 = Math.min(n - 1, i0 + 1), f = t - i0;
    const v = vals[i0] + (vals[i1] - vals[i0]) * f;
    dots += `<circle cx="${X(t).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="5" fill="#b7bcc6"/>`;
  }
  const labels = points
    .map((p, i) => (p.display != null ? `<text x="${X(i).toFixed(1)}" y="${(Y(vals[i]) - 24).toFixed(1)}" text-anchor="middle" font-size="22" font-weight="500" fill="#010716">${esc(p.display)}</text>` : ""))
    .join("");
  const xt = points
    .map((p, i) => `<text x="${X(i).toFixed(1)}" y="${H - 14}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}" font-size="18" font-weight="500" fill="#010716">${esc(p.label ?? "")}</text>`)
    .join("");
  const baseline = `<line x1="${gL}" y1="${gT + ph}" x2="${W - gR}" y2="${gT + ph}" stroke="#010716" stroke-width="1.5"/>`;
  return `<svg class="v2f-fin-svg" viewBox="0 0 ${W} ${H}">${baseline}${dots}${labels}${xt}</svg>`;
};

/* ---- pie chart (grid-10) ------------------------------------------------ */
export const finPie = (segments = []) => {
  const total = segments.reduce((s, x) => s + (+x.value || 0), 0) || 1;
  const cx = 380, cy = 380, r = 372;
  let a = -Math.PI / 2;
  const paths = segments
    .map((s, i) => {
      const frac = (+s.value || 0) / total;
      const a2 = a + frac * 2 * Math.PI;
      const x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const large = frac > 0.5 ? 1 : 0;
      a = a2;
      return `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${SEG_TONES[i % 4]}"/>`;
    })
    .join("");
  return `<svg class="v2f-fin-svg v2f-fin-pie" viewBox="0 0 760 760">${paths}</svg>`;
};

/* ---- radar / spider chart (grid-11) ------------------------------------- */
export const finRadar = ({ axes = [], values = [] } = {}) => {
  const cx = 440, cy = 420, R = 330, n = axes.length || 1;
  const mx = Math.max(...values, 1);
  const ang = (i) => -Math.PI / 2 + (i / n) * 2 * Math.PI;
  const spokes = axes
    .map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${(cx + R * Math.cos(ang(i))).toFixed(1)}" y2="${(cy + R * Math.sin(ang(i))).toFixed(1)}" stroke="#c4c9d2" stroke-width="1"/>`)
    .join("");
  const labels = axes
    .map((ax, i) => {
      const x = cx + (R + 34) * Math.cos(ang(i)), y = cy + (R + 34) * Math.sin(ang(i));
      const c = Math.cos(ang(i));
      const anc = Math.abs(c) < 0.3 ? "middle" : c > 0 ? "start" : "end";
      return `<text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="${anc}" font-size="20" font-weight="500" fill="#010716">${esc(ax)}</text>`;
    })
    .join("");
  const pts = values
    .map((v, i) => {
      const rr = R * ((+v || 0) / mx);
      return `${(cx + rr * Math.cos(ang(i))).toFixed(1)},${(cy + rr * Math.sin(ang(i))).toFixed(1)}`;
    })
    .join(" ");
  return `<svg class="v2f-fin-svg" viewBox="0 0 880 840">${spokes}<polygon points="${pts}" fill="rgba(58,63,74,.32)" stroke="#8b909b" stroke-width="1.5"/>${labels}</svg>`;
};

/* ---- the left text column of a chart-split slide (grid-09..14) ---------- */
export const finSplitLeft = ({ meta, caption, title, subtitle, legend, body, statement } = {}) => `
  <div class="v2f-fin-splitL">
    ${topBar(meta)}
    <div class="copy">
      <div class="head">
        ${caption ? `<p class="v2f-caption">${esc(caption)}</p>` : ""}
        ${title ? `<p class="v2f-fin-splittitle">${esc(title)}</p>` : ""}
        ${subtitle ? `<p class="v2f-fin-splitsub">${esc(subtitle)}</p>` : ""}
      </div>
      ${Array.isArray(legend) && legend.length ? finLegend(legend) : ""}
      ${Array.isArray(body) && body.length ? `<div class="bodytext">${body.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
      ${statement ? `<p class="v2f-fin-splitstmt">${esc(statement)}</p>` : ""}
    </div>
  </div>`;
