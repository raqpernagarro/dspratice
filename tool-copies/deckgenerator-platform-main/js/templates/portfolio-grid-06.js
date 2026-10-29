// Template: portfolio/grid-06 — a "Skills" eyebrow + a numbered skills list
// pinned to the bottom-left, beside a full-height photo on the right. Source
// Figma frame 109:10205.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/grid-06",
  slide: 75,
  figmaNode: "109:10205",
  family: "portfolio", role: "skills", shape: "split", theme: "light", chrome: false,
  use: "A skills eyebrow + numbered skills list at the bottom-left, beside a full-height photo.",
  media: ["photo"],
  capacity: { items: 5, min: 2, max: 8 },
  slots: { images: 1, titles: 0, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "portfolio/grid-06 — numbered skills list + right photo.",
  intent: {
    bestFor: ["a person's or team's skills, tools or capabilities",
      "a short ranked list of names beside a photo of the people or the work"],
    holds: "2–8 short labels of 1–3 words, numbered automatically, plus one photo; no title, only a small eyebrow",
    itemChars: 30,
    avoid: ["risks, decisions or steps — anything with an owner or an explanation",
      "sentences", "slides that need a takeaway title"],
    feel: "visual",
    needs: ["a photo related to the list"],
  },
  schema: {
    eyebrow: "string", skills: "array of strings (numbered automatically)",
    image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    eyebrow: "Skills",
    skills: ["Figma", "Photoshop", "After Effects", "Premiere Pro", "Cinema 4D"],
    image: "assets/photography/20200717-094324_Nagarro_610.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "170" },
  },
  render(s) {
    const rows = (s.skills || [])
      .map((k, i) => `<div class="v2f-pf-numrow"><span class="k">${esc(k)}</span><span class="n">${String(i + 1).padStart(2, "0")}</span></div>`)
      .join("");
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c between">
          <p class="v2f-pf-eyebrow">${esc(s.eyebrow ?? "Skills")}</p>
          <div class="v2f-pf-numlist">${rows}</div>
        </div>
        <div class="photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
