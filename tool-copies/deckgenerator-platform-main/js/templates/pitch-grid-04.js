// Template: pitch/grid-04 — a photo beside three large statements, each a figure over its sentence.
// Source Figma frame 110:37044.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptTocItem, ptMetricCard, PT_FOOTER } from "../pitch-blocks.js";
import { metric } from "../metric-blocks.js";

export default {
  name: "pitch/grid-04", slide: 270, figmaNode: "110:37044",
  family: "pitch", role: "results", shape: "split", theme: "light", chrome: false,
  use: "A full-height photo beside three large statements, each a muted figure over its sentence.",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 1, titles: 0, subtitles: 0, body: 0, stats: 3, icons: 0 },
  description: "pitch/grid-04 — photo left, three large figure + sentence statements right.",
  intent: {
    bestFor: ["three results or survey findings given real weight, with a picture", "customer feedback in numbers"],
    holds: "exactly three statements of a figure (up to 5 characters) and a sentence of up to about 60 characters; one tall photo",
    itemChars: 60,
    avoid: ["more than three statements", "text that needs a paragraph"],
    feel: "visual",
    needs: ["a tall photo"],
  },
  schema: {
    metrics: "array of 3 { value, text }", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    metrics: [
      { value: "95%", text: "of people has this problem." },
      { value: "33%", text: "of people feel that existing solutions don’t fully solve it." },
      { value: "68%", text: "of my friends and family liked this idea." },
    ],
    image: ptPhoto(3),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "10" },
    footer: PT_FOOTER,
  },
  render(s) {
    const ms = (s.metrics || []).slice(0, 3).map((m) => metric({ value: m.value, label: m.text }, { size: "medium", emphasis: "label" })).join("");
    const right = ptCol(s.meta, `<div style="display:flex;flex-direction:column;gap:64px;">${ms}</div>`, { width: 888 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">${ptImg(s.image, { style: "flex:0 0 888px;" })}${right}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
