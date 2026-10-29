// Template: case-study/grid-04 — the brief as one strong sentence in a column
// that carries its own top bar, beside a full-height photo. Source Figma frame
// 110:40156.
import { csCol, csHead, csClient, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/grid-04", slide: 240, figmaNode: "110:40156",
  family: "case-study", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "One headline that sums up the project, in a column beside a full-height photo.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "case-study/grid-04 — eyebrow + large headline, full-height photo right.",
  intent: {
    bestFor: ["the project in one sentence, with the photo given equal weight", "a single strong claim beside a large image"],
    holds: "an eyebrow of 1–2 words and a headline of up to about 90 characters; the client and project; one tall photo",
    itemChars: 90,
    avoid: ["lists or several points", "paragraphs of explanation", "figures that need a chart"],
    feel: "visual",
    needs: ["a tall photo of the work"],
  },
  schema: {
    caption: "string", title: "string — one sentence", client: "string", project: "string",
    image: "string — photo path", meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Brief",
    title: "Present the project with a captivating tagline and a brief overview of the results.",
    client: "Client", project: "Project", image: csPhoto(3),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "06" },
    footer: CS_FOOTER,
  },
  render(s) {
    const left = csCol(s.meta, `
      ${csHead({ caption: s.caption, title: s.title })}
      ${csClient(s)}`, { width: 968 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal">${left}${csImg(s.image)}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
