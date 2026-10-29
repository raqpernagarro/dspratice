// Template: case-study/data-01 — the brief in three parts: a headline, then
// three image cards, each with a question as its title and a short answer.
// Source Figma frame 110:40164.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { csHead, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/data-01", slide: 241, figmaNode: "110:40164",
  family: "case-study", role: "cards", shape: "row", theme: "light", chrome: false,
  use: "A headline over three image cards, each with a short title and a two- or three-line answer.",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 4, body: 3, stats: 0, icons: 0 },
  description: "case-study/data-01 — eyebrow + headline, three image cards with title and body.",
  intent: {
    bestFor: ["the brief in three parts: who the client is, their problem, the opportunity",
      "three parallel points that each deserve a photo and a short explanation"],
    holds: "an eyebrow, a headline of up to about 80 characters, then exactly three cards of a title (about 40 characters) and a body (about 130 characters)",
    itemChars: 140,
    avoid: ["more or fewer than three points", "points with no image to show", "long paragraphs"],
    feel: "dense",
    needs: ["three photos, one per point"],
  },
  schema: {
    caption: "string", title: "string", cards: "array of 3 { image, title, body }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Brief",
    title: "Provide an overview of the brief and background of the project.",
    cards: [
      { image: csPhoto(4), title: "Who’s the client?", body: "Introduce the client or partner you worked with. What do they do? What is their mission? What is their business model?" },
      { image: csPhoto(5), title: "What was the clients problem?", body: "Outline the problem the client approached you with. Did they have a brief from the start, or did you formulate that together?" },
      { image: csPhoto(6), title: "What opportunities did you identify?", body: "Explain your motivation here. What persuaded you to take on this project? What was the opportunity it offered?" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "07" },
    footer: CS_FOOTER,
  },
  render(s) {
    const cards = (s.cards || []).slice(0, 3).map((c) => `
      <div class="v2f-cs-card">
        ${csImg(c.image)}
        <div class="txt"><p class="ct">${esc(c.title)}</p><p class="cb">${esc(c.body)}</p></div>
      </div>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption, title: s.title }, { maxWidth: 1200 })}
        <div class="v2f-cs-cards reveal">${cards}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
