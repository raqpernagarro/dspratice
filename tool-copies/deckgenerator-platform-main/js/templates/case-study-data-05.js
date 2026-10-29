// Template: case-study/data-05 — recognition: a headline, then up to six dark
// award cards (date, award name, a square image of the award or publication)
// in two columns at the right. Source Figma frame 110:40345.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { csHead, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/data-05", slide: 259, figmaNode: "110:40345",
  family: "case-study", role: "awards", shape: "grid", theme: "light", chrome: false,
  use: "A headline over up to six award cards (date, name, square image) in a 2×3 grid.",
  media: ["photo", "logo"], capacity: { items: 6, min: 2, max: 6 },
  slots: { images: 6, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "case-study/data-05 — eyebrow + headline, 2×3 dark award cards (date, award, image).",
  intent: {
    bestFor: ["awards, rankings or press features the project received", "certifications with the year they were earned"],
    holds: "an eyebrow, a headline of up to about 110 characters, 2–6 entries of a date and a name of up to about 40 characters, each with a square image",
    itemChars: 44,
    avoid: ["anything that is not a recognition", "entries that need a description"],
    feel: "dense",
    needs: ["an image or logo per award"],
  },
  schema: {
    caption: "string", title: "string",
    awards: "array of 2–6 { date, name, image }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Results",
    title: "Did the project receive any recognition? Were there awards or features in industry publications?",
    awards: Array.from({ length: 6 }, (_, i) => ({ date: "Date", name: "Award", image: csPhoto(i) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "24" },
    footer: CS_FOOTER,
  },
  render(s) {
    const cards = (s.awards || []).slice(0, 6).map((a) => `
      <div class="v2f-cs-award">
        <div class="txt"><p class="d">${esc(a.date ?? "")}</p><p class="a">${esc(a.name ?? "")}</p></div>
        ${csImg(a.image)}
      </div>`);
    const rows = [];
    for (let i = 0; i < cards.length; i += 2) rows.push(`<div class="row">${cards.slice(i, i + 2).join("")}${cards.length - i < 2 ? `<div class="v2f-cs-award" style="visibility:hidden"></div>` : ""}</div>`);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption, title: s.title }, { maxWidth: 1200 })}
        <div class="v2f-cs-awards reveal">${rows.join("")}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
