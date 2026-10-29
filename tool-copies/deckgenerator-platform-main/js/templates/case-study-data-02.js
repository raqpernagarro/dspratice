// Template: case-study/data-02 — the scope in three columns: each a photo over a
// short title and a "> item" list (e.g. Services, Phases, Deliverables). Source
// Figma frame 110:40188.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { csHead, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/data-02", slide: 244, figmaNode: "110:40188",
  family: "case-study", role: "cards", shape: "row", theme: "light", chrome: false,
  use: "Three columns, each a photo over a short title and a list of up to five short items.",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 3, body: 0, stats: 0, icons: 0, list: 15 },
  description: "case-study/data-02 — eyebrow, three columns of photo + title + '> item' list.",
  intent: {
    bestFor: ["the scope split three ways: services, phases and deliverables",
      "three groups of short items that each deserve a photo"],
    holds: "an eyebrow, then three columns of a 1–2 word title and 3–5 items of up to about 35 characters each",
    itemChars: 35,
    avoid: ["sentences or explanations", "more or fewer than three groups", "groups with no image to show"],
    feel: "dense",
    needs: ["three photos, one per group"],
  },
  schema: {
    caption: "string", columns: "array of 3 { image, title, items: string[] (3–5) }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Scope",
    columns: [
      { image: csPhoto(8), title: "Services", items: ["Services 1", "Services 2", "Services 3", "Services 4"] },
      { image: csPhoto(9), title: "Phases", items: ["Phase 1: Research & Discovery", "Phase 2: Ideation", "Phase 3: Proposal", "Phase 4: Prototyping", "Phase 5: Implementation"] },
      { image: csPhoto(0), title: "Deliverables", items: ["Deliverable 1", "Deliverable 2", "Deliverable 3", "Deliverable 4"] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "10" },
    footer: CS_FOOTER,
  },
  render(s) {
    const cols = (s.columns || []).slice(0, 3).map((c) => `
      <div class="v2f-cs-lcol">
        ${csImg(c.image)}
        <div class="txt">
          <p class="lt">${esc(c.title)}</p>
          ${(c.items || []).slice(0, 5).map((it) => `<p>&gt; ${esc(it)}</p>`).join("")}
        </div>
      </div>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption })}
        <div class="v2f-cs-lcols reveal">${cols}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
