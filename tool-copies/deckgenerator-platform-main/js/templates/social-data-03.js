// Template: social/data-03 — an eyebrow and title over five phones, each with a short title and line underneath.
// Source Figma frame 110:22373.
// Also covers social/data-04 (posts) (same layout, a different phone), via `kind`.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/data-03", slide: 366, figmaNode: "110:22373",
  family: "social", role: "cards", shape: "row", theme: "light", chrome: false,
  use: "Five stories or posts, each with a caption",
  media: ["photo"], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 5, titles: 6, subtitles: 1, body: 5, stats: 0, icons: 0 },
  description: "social/data-03 — an eyebrow and title over five phones, each with a short title and line underneath.",
  intent: {
    bestFor: ["a story sequence or a set of post formats explained one by one"],
    holds: "an eyebrow, a title and five items with an image, a title and a line of up to about 60 characters",
    itemChars: 60,
    avoid: ["fewer than five items", "long captions"],
    feel: "visual",
    needs: ["5 images"],
  },
  schema: {
    eyebrow: "string", title: "string", items: "array of 5 {image, title, text}", kind: `"post" | "story" — the phones shown (default story)`,
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    eyebrow: "Instagram stories", title: "Title",
    items: [1, 2, 3, 4, 5].map((i) => ({ image: soPhoto(i), title: "Title", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." })), kind: "story",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "07" },
    footer: SO_FOOTER,
  },
  render(s) {
    const k = soKind(s.kind, ["post", "story"], "story");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${soHead({ eyebrow: s.eyebrow, title: s.title }, { small: true })}</div>
        <div class="v2f-so-scrs reveal">${(s.items || []).slice(0, 5).map((it) => soScreen(k, it, k === "story" ? 0.7432 : 0.689)).join("")}</div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
