// Template: social/grid-01 — a title over a phone showing a post, flanked by two pairs of images.
// Source Figma frame 110:22331.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/grid-01", slide: 363, figmaNode: "110:22331",
  family: "social", role: "gallery", shape: "row", theme: "light", chrome: false,
  use: "A post in a phone between four supporting images",
  media: ["photo"], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 5, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "social/grid-01 — a title over a phone showing a post, flanked by two pairs of images.",
  intent: {
    bestFor: ["a hero post shown in context with four related images, such as a carousel or campaign set"],
    holds: "a title, the post image and four more images",
    avoid: ["text-heavy content", "fewer than five images"],
    feel: "visual",
    needs: ["5 images"],
  },
  schema: {
    title: "string", image: "url — the post in the phone", images: "array of 4 urls — two at the left, two at the right",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Title", image: soPhoto(1), images: [soPhoto(2), soPhoto(3), soPhoto(4), soPhoto(5)],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "04" },
    footer: SO_FOOTER,
  },
  render(s) {
    const im = s.images || [];
    const pair = (a, b) => `<div class="v2f-so-pair" style="margin-top:-64px;">${soImg(a)}${soImg(b)}</div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${soHead({ title: s.title })}</div>
        <div class="v2f-so-row reveal" style="gap:2px;">${pair(im[0], im[1])}${soPhone("post", s.image, { scale: 0.8106 })}${pair(im[2], im[3])}</div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
