// Template: pitch/text-05 — a very large statement beside a full-height photo.
// Source Figma frame 110:37068.
import { esc } from "../components.js";
import { topBar, pageHeader } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptPhone, ptHand, ptFeature, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/text-05", slide: 273, figmaNode: "110:37068",
  family: "pitch", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "A very large statement of up to about 70 characters beside a full-height photo.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "pitch/text-05 — eyebrow + 100px statement, photo at the right.",
  intent: {
    bestFor: ["introducing the solution with one big sentence and a picture of the product or the team"],
    holds: "an eyebrow of 1–2 words and a statement of up to about 70 characters; one photo",
    itemChars: 70,
    avoid: ["long statements (the text is 100px)", "lists or figures"],
    feel: "visual",
    needs: ["a photo"],
  },
  schema: {
    caption: "string", title: "string — the statement", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Problem", title: "Introduce your solution to the problem in a clear, concise way.", image: ptPhoto(4),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "13" },
    footer: PT_FOOTER,
  },
  render(s) {
    const left = ptCol(s.meta, ptHead({ caption: s.caption, title: s.title }, { size: "h1" }), { width: 904 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}${ptImg(s.image, { style: "flex:0 0 904px;" })}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
