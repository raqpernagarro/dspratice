// Template: case-study/cover — the case study's title slide: a large title and
// grey subtitle over a "Client / Project" block, in a column that carries its
// own top bar, beside a tall photo. Source Figma frame 110:40115.
import { csCol, csHead, csClient, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/cover", slide: 235, figmaNode: "110:40115",
  family: "case-study", role: "cover", shape: "split", theme: "light", chrome: false,
  use: "Opens a case study: a large title and subtitle with the client and project, beside a tall photo.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "case-study/cover — large title + subtitle, client/project, tall photo right.",
  intent: {
    bestFor: ["the first slide of a client case study", "naming the client and project the story is about"],
    holds: "a title of 1–3 words, a one-line subtitle, the client and project names, one photo",
    itemChars: 40,
    avoid: ["long titles or full sentences", "anything other than the opening slide"],
    feel: "statement",
    needs: ["a photo of the work, the product or the client"],
  },
  schema: {
    title: "string", subtitle: "string", client: "string", project: "string", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Case Study", subtitle: "Subtitle here", client: "Client", project: "Project",
    image: csPhoto(0),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
    footer: CS_FOOTER,
  },
  render(s) {
    const left = csCol(s.meta, `
      ${csHead({ title: s.title, subtitle: s.subtitle }, { size: "h1", sub: "h2" })}
      ${csClient(s)}`, { width: 810 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal">${left}${csImg(s.image)}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
