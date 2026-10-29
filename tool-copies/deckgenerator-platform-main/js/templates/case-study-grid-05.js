// Template: case-study/grid-05 — the scope as a short list: an eyebrow and up
// to five large "> item" lines in a column with its own top bar, beside a
// full-height photo. Source Figma frame 110:40177.
import { esc } from "../components.js";
import { csCol, csHead, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/grid-05", slide: 243, figmaNode: "110:40177",
  family: "case-study", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A short list of up to five large items under an eyebrow, beside a full-height photo.",
  media: ["photo"], capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 1, titles: 0, body: 0, stats: 0, icons: 0, list: 5 },
  description: "case-study/grid-05 — eyebrow + large '> item' list, full-height photo right.",
  intent: {
    bestFor: ["the scope of the project as a few short deliverables or services", "a short list of names, each one or two words"],
    holds: "an eyebrow and 3–5 items of 1–3 words each, beside one tall photo",
    itemChars: 24,
    avoid: ["sentences or explanations", "more than five items", "items with owners, dates or figures"],
    feel: "visual",
    needs: ["a tall photo of the work"],
  },
  schema: {
    caption: "string", items: "array of 3–5 short strings", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Scope", items: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"], image: csPhoto(7),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "09" },
    footer: CS_FOOTER,
  },
  render(s) {
    const items = (s.items || []).slice(0, 5)
      .map((it) => `<div class="v2f-cs-li"><span class="m">&gt;</span><span>${esc(it)}</span></div>`).join("");
    const left = csCol(s.meta, `
      ${csHead({ caption: s.caption })}
      <div class="v2f-cs-list">${items}</div>`, { width: 960 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal">${left}${csImg(s.image)}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
