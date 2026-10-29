// Template: main/photo-statement — the reusable version of the full-bleed photo
// statement: any photograph, one large white sentence lower-left over a subtle
// scrim. Same layout as main/text-02 (Figma 342:39596), but main/text-02…06 are
// Nagarro's own sequence from the previous slide library and keep their own
// photos and words; this one is for any deck's content.
import { esc } from "../components.js";
import { topBar } from "../frame.js";

export default {
  name: "main/photo-statement", slide: -36.5, figmaNode: "342:39596",
  family: "main", role: "statement", shape: "single", theme: "dark", chrome: false,
  use: "A full-bleed photo statement for any content — one large white sentence over a full-page image.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/photo-statement — any photo, full bleed, big white statement lower-left.",
  intent: {
    bestFor: ["a single claim or turning point that should land with a picture behind it",
      "opening a section with a mood instead of a list"],
    holds: "one sentence of up to about 60 characters, no supporting text",
    itemChars: 70,
    avoid: ["anything with figures, lists or a second paragraph",
      "two statement slides in a row"],
    feel: "visual",
    needs: ["photo"],
  },
  schema: {
    title: "string — the statement", image: "photo URL",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Every great product starts with a conversation.",
    image: "assets/photography/20220608-090244_Nagarro_Imagefotos_Full_78547.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-dark">
        <div class="v2f-mn-tp-bg">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}<span class="scrim"></span></div>
        ${topBar(s.meta)}
        <div class="v2f-mn-tp reveal"><p class="stmt">${esc(s.title ?? "")}</p></div>
      </div>`;
  },
};
