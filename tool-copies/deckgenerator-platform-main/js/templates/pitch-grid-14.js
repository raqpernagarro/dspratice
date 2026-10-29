// Template: pitch/grid-14 — competitors on a two-axis map: a heading and note at the left, a
// quadrant with your offering marked, at the right.
// Source Figma frame 110:37244.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-14", slide: 289, figmaNode: "110:37244",
  family: "pitch", role: "diagram", shape: "split", theme: "light", chrome: false,
  use: "A heading and a note beside a two-axis map with four labelled ends and your offering marked.",
  media: [], capacity: { items: 1, min: 1, max: 5 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "pitch/grid-14 — heading + note, two-axis competitor map.",
  intent: {
    bestFor: ["where the product sits against competitors on two dimensions"],
    holds: "an eyebrow, a title, a note of up to about 300 characters, four axis labels of up to about 20 characters, and your offering's position (plus any competitors)",
    itemChars: 300,
    avoid: ["more than five points", "a plain list of competitors (use pitch/text-11)"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string",
    axes: "{ top, bottom, left, right } — the four labels",
    offering: "{ label, x, y } — position from 0 (left / top) to 1 (right / bottom)", others: "array of { label, x, y } — optional",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market", title: "Competitors", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ipsum purus, feugiat vel dolor sed, malesuada lobortis urna. Proin a lectus ut nibh euismod egestas. Aenean non tincidunt ex, a dapibus sem. Curabitur efficitur accumsan mollis. Donec in auctor ligula, vitae commodo turpis.",
    axes: { top: "Product 1", bottom: "Product 3", left: "Product 4", right: "Product 2" },
    offering: { label: "Your offering", x: 0.82, y: 0.22 },
    meta: { studio: "Product Studio", name: "Presentation Name", page: "29" },
    footer: PT_FOOTER,
  },
  render(s) {
    const a = s.axes || {};
    const pts = [{ ...(s.offering || {}), me: true }, ...(s.others || [])].filter((p) => p && p.label != null);
    const quad = `
      <div class="v2f-pt-quad">
        <div class="vl"></div><div class="hl"></div>
        <p class="ax" style="left:50%;top:-48px;transform:translateX(-50%);">${esc(a.top ?? "")}</p>
        <p class="ax" style="left:50%;bottom:-64px;transform:translateX(-50%);">${esc(a.bottom ?? "")}</p>
        <p class="ax" style="left:-150px;top:50%;transform:translateY(-50%);">${esc(a.left ?? "")}</p>
        <p class="ax" style="right:-150px;top:50%;transform:translateY(-50%);">${esc(a.right ?? "")}</p>
        ${pts.map((p) => `<div class="dot" style="left:${(Number(p.x) || 0.5) * 100}%;top:${(Number(p.y) || 0.5) * 100}%;"><i${p.me ? "" : ' style="background:rgba(1,7,22,.4)"'}></i><p>${esc(p.label)}</p></div>`).join("")}
      </div>`;
    const left = ptCol(s.meta, `
      ${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}
      ${s.body ? `<p class="v2f-pt-body" style="margin-top:auto;">${esc(s.body)}</p>` : ""}`, { width: 597, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:24px;">${left}<div class="v2f-pt-stage">${quad}</div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
