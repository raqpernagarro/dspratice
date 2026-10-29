// Template: portfolio/split-01 — a large, vertically-centered statement with an
// inline photo chip embedded in the sentence ("I'm a ▢ Designer from Los
// Angeles"). Source Figma frame 109:10056.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "portfolio/split-01",
  slide: 67,
  figmaNode: "109:10056",
  family: "portfolio", role: "statement", shape: "single", theme: "light", chrome: false,
  use: "A big centered statement with an inline photo chip embedded in the sentence.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/split-01 — big statement with an inline photo chip.",
  schema: {
    pre: "string — text before the chip", image: "string — photo path",
    post: "string — text after the chip",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    pre: "I’m a", image: "assets/photography/20200717-091614_Nagarro_444.jpg",
    post: "Designer from Los Angeles",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "162" },
  },
  render(s) {
    const chip = s.image ? `<span class="v2f-pf-chip"><img src="${esc(s.image)}" alt=""></span>` : "";
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-pf-statement reveal"><p>${esc(s.pre ?? "")} ${chip} ${esc(s.post ?? "")}</p></div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
