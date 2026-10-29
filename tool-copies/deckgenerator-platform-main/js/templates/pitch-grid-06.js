// Template: pitch/grid-06 — the product's features on a phone: three features at the left, one
// in focus, and a phone showing your screen at the right. The other two
// states of this slide in Figma (grid-07, grid-08) are the same layout with
// the second or third feature in focus — `active` picks it.
// Source Figma frame 110:37086.
import { esc } from "../components.js";
import { topBar, pageHeader } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptPhone, ptHand, ptFeature, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-06", slide: 276, figmaNode: "110:37086",
  family: "pitch", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "A product name and three features, one in focus, beside a phone on a tinted stage.",
  media: ["photo"], capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 1, titles: 4, subtitles: 1, body: 3, stats: 0, icons: 0 },
  description: "pitch/grid-06 — product + three features (one in focus), phone on a tinted stage.",
  intent: {
    bestFor: ["walking through the main features of an app, one slide per feature in focus", "a product slide that needs a short list of what it does"],
    holds: "an eyebrow, a product name, a subtitle, and 2–3 features of a name (up to 24 characters) and one or two lines (up to about 110 characters); one app screenshot",
    itemChars: 110,
    avoid: ["more than three features", "features with figures", "products that are not apps"],
    feel: "visual",
    needs: ["a phone screenshot"],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string",
    features: "array of 2–3 { title, body }", active: "number — index of the feature in focus, 0–2 (default 0)",
    image: "string — the screenshot shown on the phone",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Product", title: "Product", subtitle: "Features",
    features: [1, 2, 3].map((n) => ({ title: "Feature " + n, body: "If there is smaller text that would go here. Lorem ipsum dolor sit amet, consectetur adipiscing elit." })),
    active: 0, image: ptPhoto(7),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "16" },
    footer: PT_FOOTER,
  },
  render(s) {
    const act = Number.isInteger(s.active) ? s.active : 0;
    const feats = (s.features || []).slice(0, 3).map((f, i) => ptFeature(f, i !== act)).join("");
    const left = ptCol(s.meta, `
      ${ptHead({ caption: s.caption, title: s.title, subtitle: s.subtitle }, { size: "h2", sub: "h4" })}
      <div class="v2f-pt-feats">${feats}</div>`, { width: 597, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:24px;">${left}<div class="v2f-pt-stage">${ptPhone(s.image)}</div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
