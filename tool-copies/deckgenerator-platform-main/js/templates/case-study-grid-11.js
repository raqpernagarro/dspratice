// Template: case-study/grid-11 — the testimonial: a client quote as a large
// headline, the name of who said it below, and a tall photo at the right.
// Source Figma frame 110:40358.
import { esc } from "../components.js";
import { csCol, csHead, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/grid-11", slide: 260, figmaNode: "110:40358",
  family: "case-study", role: "quote", shape: "split", theme: "light", chrome: false,
  use: "A client quote as a large headline, the person's name below it, and a tall photo at the right.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "case-study/grid-11 — eyebrow + quote headline + name, tall photo right.",
  intent: {
    bestFor: ["a client testimonial or a line from an article praising the work"],
    holds: "an eyebrow, a quote of up to about 120 characters (four lines), the speaker's name and role on two lines, one photo",
    itemChars: 130,
    avoid: ["the team's own claims (it reads as a quote)", "long quotes or several quotes"],
    feel: "statement",
    needs: ["a photo of the speaker or the work"],
  },
  schema: {
    caption: "string", title: "string — the quote", name: "string", role: "string — role or surname line",
    image: "string — photo path", meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Brief",
    title: "Add a quote from the client or an article that commends your work or highlights the way you managed the project.",
    name: "Name", role: "Surname", image: csPhoto(3),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "25" },
    footer: CS_FOOTER,
  },
  render(s) {
    const who = [s.name, s.role].filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:24px;">
          ${csCol(s.meta, `${csHead({ caption: s.caption, title: s.title })}${who ? `<div class="v2f-cs-lines">${who}</div>` : ""}`, { width: 968 })}
          ${csImg(s.image)}
        </div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
