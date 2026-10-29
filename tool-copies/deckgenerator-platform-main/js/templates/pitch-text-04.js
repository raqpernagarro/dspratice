// Template: pitch/text-04 — a very large statement beside a hand holding a phone, the hand
// running off the bottom-right of the slide.
// Source Figma frame 110:37062.
import { esc } from "../components.js";
import { topBar, pageHeader } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptPhone, ptHand, ptFeature, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/text-04", slide: 272, figmaNode: "110:37062",
  family: "pitch", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "A very large statement of up to about 70 characters beside a hand holding a phone that shows your screen.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "pitch/text-04 — eyebrow + 100px statement, hand-held phone at the right.",
  intent: {
    bestFor: ["introducing the solution when the product is an app: one big sentence and the app in someone's hand"],
    holds: "an eyebrow of 1–2 words and a statement of up to about 70 characters; one screenshot of the app",
    itemChars: 70,
    avoid: ["long statements (the text is 100px)", "products that are not on a phone"],
    feel: "visual",
    needs: ["a phone screenshot"],
  },
  schema: {
    caption: "string", title: "string — the statement", image: "string — the screenshot shown on the phone",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Problem", title: "Introduce your solution to the problem in a clear, concise way.", image: ptPhoto(5),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "12" },
    footer: PT_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32 v2f-bleed">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal"><div style="flex:0 0 908px;">${ptHead({ caption: s.caption, title: s.title }, { size: "h1" })}</div></div>
        ${ptFooter(s.footer)}
        ${ptHand(s.image)}
      </div>`;
  },
};
