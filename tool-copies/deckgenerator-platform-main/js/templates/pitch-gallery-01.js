// Template: pitch/gallery-01 — a business model as four cards around a central logo.
// Source Figma frame 110:37163.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/gallery-01", slide: 283, figmaNode: "110:37163",
  family: "pitch", role: "diagram", shape: "grid", theme: "light", chrome: false,
  use: "A heading and four titled cards in a 2×2 grid around a central logo circle.",
  media: ["logo"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 1, titles: 5, subtitles: 0, body: 4, stats: 0, icons: 0 },
  description: "pitch/gallery-01 — heading + four cards around a logo.",
  intent: {
    bestFor: ["the business model: four parts that all serve one product, partner or customer in the middle"],
    holds: "an eyebrow, a title of up to about 30 characters, exactly four cards of a title and a sentence of up to about 90 characters, and a logo or short label for the centre",
    itemChars: 90,
    avoid: ["more or fewer than four parts", "long explanations"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", cards: "array of 4 { title, body }", logo: "string — optional image for the centre circle", logoLabel: "string — label shown when there is no logo",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Business", title: "Business model",
    cards: Array.from({ length: 4 }, () => ({ title: "Title", body: "Lorem ipsum dolor sit amet, consectetur\nadipiscing elit, sed do eiusmod tempor." })),
    logoLabel: "Logo",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "23" },
    footer: PT_FOOTER,
  },
  render(s) {
    const cs = (s.cards || []).slice(0, 4);
    const card = (c = {}) => `<div class="v2f-pt-tcard"><p class="t">${esc(c.title ?? "")}</p><p class="b">${esc(c.body ?? "")}</p></div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}
        <div class="v2f-pt-tcards reveal">
          <div class="row">${card(cs[0])}${card(cs[1])}</div>
          <div class="row">${card(cs[2])}${card(cs[3])}</div>
          <div class="v2f-pt-logo">${s.logo ? `<img src="${esc(s.logo)}" alt="">` : `<span>${esc(s.logoLabel ?? "")}</span>`}</div>
        </div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
