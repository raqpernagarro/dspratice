// Template: main/split-09 — a heading + prose on the left with an org/merge tree of topic
// nodes on the right (four leaves merge to two, then one, then a vertical chain).
// Source Figma frame 342:40451.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

// node centres (cx,cy) in the 720×480 diagram box; edges = [lowerIdx, upperIdx].
const NODES = [
  { cx: 100, cy: 22, t: "Topic" }, { cx: 250, cy: 22, t: "Topic" },
  { cx: 470, cy: 22, t: "Topic" }, { cx: 620, cy: 22, t: "Topic" },
  { cx: 175, cy: 158, t: "Topic" }, { cx: 545, cy: 158, t: "Topic" },
  { cx: 360, cy: 294, t: "Topic" },
  { cx: 360, cy: 388, t: "Topic" }, { cx: 360, cy: 458, t: "Topic" },
];
const EDGES = [[4, 0], [4, 1], [5, 2], [5, 3], [6, 4], [6, 5], [7, 6], [8, 7]];
const NW = 92, NH = 44;

export default {
  name: "main/split-09", slide: -15, figmaNode: "342:40451",
  family: "main", role: "content", shape: "diagram", theme: "light", chrome: false,
  use: "A heading + prose on the left with an org/merge tree of topic nodes on the right.",
  media: [], capacity: { items: 9, min: 3, max: 12 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "main/split-09 — heading + prose left, org/merge tree right.",
  schema: {
    caption: "string — eyebrow", title: "string — heading", subtitle: "string — muted 2nd line",
    body: "array of paragraph strings", nodes: "array of { cx, cy, t }", edges: "array of [lower, upper]",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", subtitle: "Subtitle",
    body: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus et  malesuada fames ac turpis egestas. Nulla at risus. Quisque purus magna,  auctor et, sagittis ac, posuere eu, lectus. Nam mattis, felis ut  adipiscing.Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum."],
    nodes: NODES, edges: EDGES,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const nodes = s.nodes || NODES;
    const edges = s.edges || EDGES;
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    // orthogonal elbow with just the corners rounded (radius R), straight elsewhere
    const R = 12;
    const roundedPath = (pin) => {
      // drop consecutive duplicate points (straight verticals collapse the mid-nodes)
      const p = pin.filter((pt, i) => i === 0 || pt[0] !== pin[i - 1][0] || pt[1] !== pin[i - 1][1]);
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
      return d + ` L ${last[0]} ${last[1]}`;
    };
    const paths = edges.map(([lo, up]) => {
      const L = nodes[lo], U = nodes[up];
      const sy = L.cy - NH / 2, ey = U.cy + NH / 2, midY = (sy + ey) / 2;
      const d = roundedPath([[L.cx, sy], [L.cx, midY], [U.cx, midY], [U.cx, ey]]);
      return `<path d="${d}" fill="none" stroke="rgba(1,7,22,.4)" stroke-width="1.5"/>` +
        `<polygon points="${U.cx - 5},${ey + 8} ${U.cx + 5},${ey + 8} ${U.cx},${ey}" fill="rgba(1,7,22,.4)"/>`;
    }).join("");
    const boxes = nodes.map((n) => `<div class="node" style="left:${n.cx - NW / 2}px;top:${n.cy - NH / 2}px;">${esc(n.t)}</div>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-sp9 reveal">
          <div class="side">
            ${pageHeader({ caption: s.caption, title: s.title ?? "", subtitle: s.subtitle })}
            <div class="v2f-mn-prose">${body}</div>
          </div>
          <div class="tree">
            <div class="tbox">
              <svg viewBox="0 0 720 480" width="720" height="480" aria-hidden="true">${paths}</svg>
              ${boxes}
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
