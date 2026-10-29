// Template: pitch/text-07 — the product on a phone: a heading and description at the left, a
// phone showing your screen on a tinted stage at the right.
// Source Figma frame 110:37079.
import { esc } from "../components.js";
import { topBar, pageHeader } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptPhone, ptHand, ptFeature, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/text-07", slide: 275, figmaNode: "110:37079",
  family: "pitch", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "A product name with a description beside a phone on a tinted stage.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 2, body: 1, stats: 0, icons: 0 },
  description: "pitch/text-07 — product name + description, phone on a tinted stage.",
  intent: {
    bestFor: ["showing the product: its name, what it is, and the app on screen"],
    holds: "an eyebrow, a subtitle, a product name, a description line, and a paragraph of up to about 280 characters; one app screenshot",
    itemChars: 280,
    avoid: ["products that are not apps", "several screens (show one)"],
    feel: "visual",
    needs: ["a phone screenshot"],
  },
  schema: {
    caption: "string", kicker: "string — small line above the name", title: "string — product name", subtitle: "string — line under the name",
    body: "string — paragraph at the bottom", image: "string — the screenshot shown on the phone",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Product", kicker: "Subtitle", title: "Product", subtitle: "Description",
    body: "Elaborate on how your idea will change the world. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.", image: ptPhoto(7),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "15" },
    footer: PT_FOOTER,
  },
  render(s) {
    const left = ptCol(s.meta, `
      <div class="v2f-cs-head">
        ${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}
        ${s.kicker ? `<p class="v2f-cs-h4 v2f-cs-muted">${esc(s.kicker)}</p>` : ""}
        ${s.title ? `<p class="v2f-cs-h2">${esc(s.title)}</p>` : ""}
        ${s.subtitle ? `<p class="v2f-cs-h4 v2f-cs-muted">${esc(s.subtitle)}</p>` : ""}
      </div>
      ${s.body ? `<p class="v2f-cs-h6 v2f-cs-muted" style="margin-top:auto;">${esc(s.body)}</p>` : ""}`, { width: 597, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:24px;">${left}<div class="v2f-pt-stage">${ptPhone(s.image)}</div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
