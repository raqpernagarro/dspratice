// Template: social/grid-03 — an eyebrow, title and paragraph in a left column; at the right a staggered wall of phones running off the top, bottom and right edge.
// Source Figma frame 110:22349.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/grid-03", slide: 365, figmaNode: "110:22349",
  family: "social", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "Feed overview: heading and paragraph beside a wall of posts",
  media: ["photo"], capacity: { items: 13, min: 3, max: 13 },
  slots: { images: 13, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "social/grid-03 — an eyebrow, title and paragraph in a left column; at the right a staggered wall of phones running off the top, bottom and right edge.",
  intent: {
    bestFor: ["introducing a channel's feed with a short explanation"],
    holds: "an eyebrow, a title, a paragraph of up to about 250 characters and three or more post images",
    itemChars: 250,
    avoid: ["long paragraphs", "no images"],
    feel: "visual",
    needs: ["3+ images"],
  },
  schema: {
    eyebrow: "string", title: "string", body: "string", images: "array of up to 13 urls", kind: `"post" | "story" — the phones shown (default post)`,
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    eyebrow: "Instagram posts", title: "Title", body: SO_LOREM, images: [soPhoto(1), soPhoto(2), soPhoto(3), soPhoto(4), soPhoto(5), soPhoto(6), soPhoto(7)], kind: "post",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "06" },
    footer: SO_FOOTER,
  },
  render(s) {
    const k = soKind(s.kind, ["post", "story"], "post");
    const im = (s.images || []).filter(Boolean);
    const at = (i) => im.length ? im[i % im.length] : undefined;
    // Figma: five columns from x 754, 436 apart; columns 1, 3, 5 hold three phones from y -724, 2 and 4 hold two from y -300.
    let n = 0;
    const cols = [0, 1, 2, 3, 4].map((c) => [754 + c * 436, c % 2 ? -300 : -724, c % 2 ? 2 : 3]);
    return `
      <div class="v2f-root v2f-g32 v2f-so-wallroot">
        <div class="v2f-so-wall">${cols.map(([x, y, c]) => `<div class="wc" style="left:${x}px;top:${y}px;gap:16px;">${Array.from({ length: c }, () => soPhone(k, at(n++))).join("")}</div>`).join("")}</div>
        <div class="v2f-so-lcol reveal" style="position:relative;z-index:1;flex:1 1 0;width:650px;">${topBar(s.meta)}
          ${soHead({ eyebrow: s.eyebrow, title: s.title, body: s.body }, { bottom: true })}</div>
      </div>`;
  },
};
