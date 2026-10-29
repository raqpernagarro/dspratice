// Template: pitch/grid-09 — a product's features as a checklist: a heading with a note, then
// up to eight feature rows, two columns, ticked.
// Source Figma frame 110:37116.
import { esc } from "../components.js";
import { topBar, pageHeader } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptPhone, ptHand, ptFeature, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-09", slide: 279, figmaNode: "110:37116",
  family: "pitch", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A heading with a note, then up to eight ticked feature rows in two columns.",
  media: [], capacity: { items: 8, min: 4, max: 8 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 8 },
  description: "pitch/grid-09 — heading + note, eight ticked feature rows.",
  intent: {
    bestFor: ["a checklist of what the product does or includes", "features that need a name only, no explanation"],
    holds: "an eyebrow, a title, a subtitle, a note of up to about 240 characters, and 4–8 feature names of up to about 26 characters",
    itemChars: 26,
    avoid: ["features that need a sentence each (use pitch/grid-06)", "more than eight items"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    features: "array of 4–8 strings — filled down the left column first",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Product", title: "Product", subtitle: "Features", intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    features: Array.from({ length: 8 }, () => "Name of feature"),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "19" },
    footer: PT_FOOTER,
  },
  render(s) {
    const fs = (s.features || []).slice(0, 8);
    const half = Math.ceil(fs.length / 2);
    const col = (items) => `<div class="v2f-pt-fcol">${items.map((f) => `<div class="v2f-pt-fitem"><span>${esc(f)}</span><img src="assets/pitch/check.svg" alt=""></div>`).join("")}</div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true })}
        <div class="v2f-pt-fgrid reveal">${col(fs.slice(0, half))}${col(fs.slice(half))}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
