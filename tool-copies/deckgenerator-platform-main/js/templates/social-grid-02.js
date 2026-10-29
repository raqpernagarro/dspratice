// Template: social/grid-02 — a phone showing a post at the left and a strip of three images beside it, with no heading.
// Source Figma frame 110:22341.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/grid-02", slide: 364, figmaNode: "110:22341",
  family: "social", role: "gallery", shape: "row", theme: "light", chrome: false,
  use: "A post in a phone beside a strip of three images",
  media: ["photo"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "social/grid-02 — a phone showing a post at the left and a strip of three images beside it, with no heading.",
  intent: {
    bestFor: ["a post next to the carousel slides or follow-up posts it leads into"],
    holds: "the post image and three more images",
    avoid: ["slides that need a heading", "fewer than four images"],
    feel: "visual",
    needs: ["4 images"],
  },
  schema: {
    image: "url — the post in the phone", images: "array of 3 urls",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    image: soPhoto(1), images: [soPhoto(2), soPhoto(3), soPhoto(4)],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "05" },
    footer: SO_FOOTER,
  },
  render(s) {
    const im = s.images || [];
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-so-row reveal" style="gap:2px;">${soPhone("post", s.image, { scale: 0.9399 })}
          <div class="v2f-so-strip" style="margin-top:-66px;">${[0, 1, 2].map((i) => soImg(im[i])).join("")}</div></div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
