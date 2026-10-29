// Template: pitch/text-10 — the business model canvas: nine cells in the canvas arrangement.
// Source Figma frame 110:37175.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/text-10", slide: 284, figmaNode: "110:37175",
  family: "pitch", role: "diagram", shape: "grid", theme: "light", chrome: false,
  use: "A heading over the nine cells of a business model canvas.",
  media: [], capacity: { items: 9, min: 9, max: 9 },
  slots: { images: 0, titles: 10, subtitles: 0, body: 9, stats: 0, icons: 0 },
  description: "pitch/text-10 — heading + nine-cell business model canvas.",
  intent: {
    bestFor: ["a full business model canvas on one slide: partners, activities, resources, value, relations, channels, segments, costs, revenue"],
    holds: "an eyebrow, a title, and nine cells of a name and a sentence of up to about 90 characters",
    itemChars: 90,
    avoid: ["anything that is not a canvas", "long text in the cells"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string",
    cells: "array of 9 { title, body } in this order: key partners, key activities, key resources, value proposition, customer relations, channels, customer segments, cost structure, revenue streams",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Business", title: "Business model canvas",
    cells: ["Key partners", "Key activities", "Key resources", "Value proposition", "Customer relations", "Channels", "Customer segments", "Cost structure", "Revenue streams"].map((title) => ({ title, body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "24" },
    footer: PT_FOOTER,
  },
  render(s) {
    const c = s.cells || [];
    const cell = (x = {}) => `<div class="v2f-pt-cell"><p class="t">${esc(x.title ?? "")}</p><p class="b">${esc(x.body ?? "")}</p></div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}
        <div class="v2f-pt-bmc reveal">
          <div class="r1">
            <div class="col">${cell(c[0])}</div>
            <div class="col">${cell(c[1])}${cell(c[2])}</div>
            <div class="col">${cell(c[3])}</div>
            <div class="col">${cell(c[4])}${cell(c[5])}</div>
            <div class="col">${cell(c[6])}</div>
          </div>
          <div class="r2">${cell(c[7])}${cell(c[8])}</div>
        </div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
