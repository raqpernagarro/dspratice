// Template: marketing/grid-18 — a wide photo at the left and a numbered list of up to five items at the right with 100px numerals; `active` fades the others.
// Source Figma frame 110:30883.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-18", slide: 335, figmaNode: "110:30883",
  family: "marketing", role: "index", shape: "split", theme: "light", chrome: false,
  use: "A numbered list of up to five items beside a photo, one optionally in focus",
  media: ["photo"], capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 1, titles: 5, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "marketing/grid-18 — a wide photo at the left and a numbered list of up to five items at the right with 100px numerals; `active` fades the others.",
  intent: {
    bestFor: ["running through a list of brands, ideas or pillars one at a time — repeat with a different `active`"],
    holds: "three to five items with a label of up to about 24 characters, and a photo",
    itemChars: 24,
    avoid: ["more than five items", "long labels"],
    feel: "statement",
    needs: ["a photo"],
  },
  schema: {
    items: "array of up to 5 strings", active: "number — the item in focus (0-based); omit to show all", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    items: ["Brand 1", "Brand 2", "Brand 3", "Brand 4", "Brand 5"], active: 0, image: mkPhoto(5),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "28" },
    footer: MK_FOOTER,
  },
  render(s) {
    const it = (s.items || []).slice(0, 5); const a = Number.isInteger(s.active) ? s.active : null;
    const right = mkCol(s.meta, `<div class="v2f-mk-nl">${it.map((t, i) => `<div class="i${a !== null && a !== i ? " dim" : ""}"><span class="n">${String(i + 1).padStart(2, "0")}</span><span class="l">${esc(t)}</span></div>`).join("")}</div>`, { width: 900 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:40px;">${mkImg(s.image)}${right}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
