// Template: case-study/grid-02 — a quieter case-study opener: a narrow column
// with a logo-only top bar, an eyebrow, a title and a short subtitle, beside a
// wide photo. Source Figma frame 110:40123.
import { csCol, csHead, csClient, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/grid-02", slide: 236, figmaNode: "110:40123",
  family: "case-study", role: "cover", shape: "split", theme: "light", chrome: false,
  use: "An introduction to a case study: eyebrow, title and short subtitle in a narrow column beside a wide photo.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "case-study/grid-02 — eyebrow + title + subtitle, narrow left column, wide photo right.",
  intent: {
    bestFor: ["introducing a case study or one chapter of it", "a visual opener where the photo leads"],
    holds: "an eyebrow of 1–2 words, a title of 1–3 words, a one-line subtitle, the client and project, one wide photo",
    itemChars: 40,
    avoid: ["long titles or paragraphs", "slides that need body text or a list"],
    feel: "visual",
    needs: ["a wide photo of the work or the setting"],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", client: "string", project: "string",
    image: "string — photo path", meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Introduction", title: "Case Study", subtitle: "Subtitle here", client: "Client", project: "Project",
    image: csPhoto(1),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "02" },
    footer: CS_FOOTER,
  },
  render(s) {
    const left = csCol(s.meta, `
      ${csHead({ caption: s.caption, title: s.title, subtitle: s.subtitle }, { size: "h2", sub: "h5", gap12: true })}
      ${csClient(s)}`, { width: 600, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal">${left}${csImg(s.image)}</div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
