// Template: marketing/grid-05 — a short heading, then a map with a vertical and a horizontal axis and up to five shaded shapes, each holding a few brands.
// Source Figma frame 110:30550.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-05", slide: 317, figmaNode: "110:30550",
  family: "marketing", role: "diagram", shape: "grid", theme: "light", chrome: false,
  use: "A two-axis perception map with up to five shaded categories of brands",
  media: [], capacity: { items: 5, min: 2, max: 5 },
  slots: { images: 0, titles: 4, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "marketing/grid-05 — a short heading, then a map with a vertical and a horizontal axis and up to five shaded shapes, each holding a few brands.",
  intent: {
    bestFor: ["positioning brands or competitors on two axes (for example accessible–exclusive, traditional–avant-garde)"],
    holds: "a heading and a sentence, four axis labels, and two to five categories with a name and two to four brands each",
    itemChars: 12,
    avoid: ["more than five categories", "brand names longer than 12 characters"],
    feel: "visual",
    needs: [],
  },
  schema: {
    title: "string", body: "string", axes: "{top, bottom, left, right}", categories: "array of up to 5 {label, brands: string[]} — the shapes are fixed, in the order of the array",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Market", body: "Describe the purpose of the map and why these axes matter for understanding the market landscape.",
    axes: { top: "Avant-garde", bottom: "Traditional", left: "Accessible", right: "Exclusive" },
    categories: [
      { label: "Category 1", brands: ["Brand 1", "Brand 2", "Brand 3"] },
      { label: "Category 2", brands: ["Brand 1", "Brand 2"] },
      { label: "Category 3", brands: ["Brand 1", "Brand 2", "Brand 3"] },
      { label: "Category 4", brands: ["Brand 1", "Brand 2", "Brand 3"] },
      { label: "Category 5", brands: ["Brand 1", "Brand 2"] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "10" },
    footer: MK_FOOTER,
  },
  render(s) {
    // Figma 110:30550 — the 1840×808 map; each shape, its brand positions and
    // label are fixed in the frame, so categories fill them in order.
    const SHAPES = [
      { n: 1, x: 273, y: 257, w: 468, h: 444, b: [[355, 349], [466, 497], [592, 604], [0, 0]], bc: "w", l: [638, 717, "left", "var(--fg-100,#010716)"] },
      { n: 2, x: 711, y: 242, w: 428, h: 284, b: [[769, 441], [1009, 323]], bc: "d", l: [1195.5, 282, "center", "var(--fg-60,rgba(1,7,22,.6))"] },
      { n: 3, x: 929, y: 0, w: 724, h: 228, b: [[1050, 129], [1314, 51], [1540, 112]], bc: "w", l: [1709.5, 135, "center", "var(--fg-60,rgba(1,7,22,.6))"] },
      { n: 4, x: 895, y: 410, w: 636, h: 272, b: [[1002, 555], [1148, 470], [1352, 509]], bc: "w", l: [1587.5, 537, "center", "var(--fg-75,rgba(1,7,22,.75))"] },
      { n: 5, x: 1139, y: 612, w: 504, h: 196, b: [[1246, 708], [1458, 704]], bc: "d", l: [1699.5, 741, "center", "var(--fg-60,rgba(1,7,22,.6))"] },
    ];
    const a = s.axes || {};
    const cats = (s.categories || []).slice(0, 5).map((c, i) => {
      const sh = SHAPES[i];
      const brands = (c.brands || []).slice(0, sh.b.filter((p) => p[0]).length)
        .map((b, j) => `<span class="v2f-mk-lb ${sh.bc}" style="left:${sh.b[j][0]}px;top:${sh.b[j][1]}px;">${esc(b)}</span>`).join("");
      const [lx, ly, al, col] = sh.l;
      const lab = al === "center"
        ? `<span class="v2f-mk-lb" style="left:${lx}px;top:${ly}px;transform:translateX(-50%);color:${col};">${esc(c.label ?? "")}</span>`
        : `<span class="v2f-mk-lb" style="left:${lx}px;top:${ly}px;color:${col};">${esc(c.label ?? "")}</span>`;
      return `<img class="v2f-mk-blob" src="assets/marketing/blob-${sh.n}.svg" alt="" style="left:${sh.x}px;top:${sh.y}px;width:${sh.w}px;height:${sh.h}px;">${brands}${lab}`;
    }).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-map reveal">
          <i class="ax v"></i><i class="ax h"></i>
          <span class="v2f-mk-lb" style="left:920px;top:0;transform:translateX(-50%);">${esc(a.top ?? "")}</span>
          <span class="v2f-mk-lb" style="left:920px;top:780px;transform:translateX(-50%);">${esc(a.bottom ?? "")}</span>
          <span class="v2f-mk-lb" style="left:0;top:390px;">${esc(a.left ?? "")}</span>
          <span class="v2f-mk-lb" style="left:1840px;top:390px;transform:translateX(-100%);">${esc(a.right ?? "")}</span>
          ${cats}
          <div class="v2f-mk-maphead">
            <p class="v2f-cs-h6">${esc(s.title ?? "")}</p>
            <p class="b">${esc(s.body ?? "")}</p>
          </div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
