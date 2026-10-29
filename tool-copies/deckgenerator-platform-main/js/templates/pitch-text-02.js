// Template: pitch/text-02 — the opening statement: a large paragraph-length headline beside a
// photo.
// Source Figma frame 110:37018.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptTocItem, ptMetricCard, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/text-02", slide: 266, figmaNode: "110:37018",
  family: "pitch", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "A large statement of up to about 120 characters beside a photo.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "pitch/text-02 — eyebrow + large statement, photo at the right.",
  intent: {
    bestFor: ["the opening slide of a pitch: what the company does and why, in a sentence or two", "the context for the rest of the deck"],
    holds: "an eyebrow of 1–2 words and a statement of up to about 130 characters; one photo",
    itemChars: 130,
    avoid: ["lists or figures", "long paragraphs"],
    feel: "statement",
    needs: ["a photo"],
  },
  schema: {
    caption: "string", title: "string — the statement", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Problem", title: "This opening slide sets the context for the rest of the presentation. Clearly and concisely describe your company’s purpose.", image: ptPhoto(2),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "06" },
    footer: PT_FOOTER,
  },
  render(s) {
    const left = ptCol(s.meta, ptHead({ caption: s.caption, title: s.title }, { size: "h2" }), { width: 900 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:40px;">${left}${ptImg(s.image, { style: "flex:0 0 900px;" })}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
