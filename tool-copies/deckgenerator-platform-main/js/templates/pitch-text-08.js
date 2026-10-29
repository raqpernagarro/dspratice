// Template: pitch/text-08 — a product demo: a narrow label column beside a large screenshot.
// Source Figma frame 110:37132.
import { esc } from "../components.js";
import { topBar, pageHeader } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptPhone, ptHand, ptFeature, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/text-08", slide: 280, figmaNode: "110:37132",
  family: "pitch", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "A narrow label (demo, product) beside a large screenshot or video still.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "pitch/text-08 — narrow label, large screenshot.",
  intent: {
    bestFor: ["a product demo or walkthrough: the screen of the product at full size"],
    holds: "a label of one or two words and a product name; one wide screenshot",
    itemChars: 24,
    avoid: ["any text beyond the label", "phone screens (use pitch/text-07)"],
    feel: "visual",
    needs: ["a wide screenshot"],
  },
  schema: {
    title: "string — e.g. Demo", subtitle: "string — e.g. the product name", image: "string — the screenshot",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Demo", subtitle: "Product", image: ptPhoto(8),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "20" },
    footer: PT_FOOTER,
  },
  render(s) {
    const left = ptCol(s.meta, `<div class="v2f-cs-head" style="gap:0;"><p class="v2f-cs-h4">${esc(s.title ?? "")}</p><p class="v2f-cs-h4 v2f-cs-muted">${esc(s.subtitle ?? "")}</p></div>`, { width: 402, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">${left}${ptImg(s.image)}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
