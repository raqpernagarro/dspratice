// Template: social/split-01 — a full-bleed wall of phones in five staggered columns, bleeding off the top, bottom and sides, under the header.
// Source Figma frame 110:22290.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/split-01", slide: 361, figmaNode: "110:22290",
  family: "social", role: "gallery", shape: "collage", theme: "light", chrome: false,
  use: "Wall of social posts or stories as a mood or channel overview",
  media: ["photo"], capacity: { items: 7, min: 3, max: 7 },
  slots: { images: 7, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "social/split-01 — a full-bleed wall of phones in five staggered columns, bleeding off the top, bottom and sides, under the header.",
  intent: {
    bestFor: ["showing the volume and look of a feed at a glance", "a section opener for social content"],
    holds: "three to seven post or story images, no text",
    avoid: ["slides that need a heading or explanation", "fewer than three images"],
    feel: "visual",
    needs: ["3+ images"],
  },
  schema: {
    images: "array of up to 7 urls, one per phone", kind: `"post" | "story" — the phones shown (default post)`,
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    images: [soPhoto(1), soPhoto(2), soPhoto(3), soPhoto(4), soPhoto(5), soPhoto(6), soPhoto(7)], kind: "post",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "02" },
    footer: SO_FOOTER,
  },
  render(s) {
    const k = soKind(s.kind, ["post", "story"], "post");
    const im = (s.images || []).filter(Boolean);
    const at = (i) => im.length ? im[i % im.length] : undefined;
    // Figma: columns at x -198, 280, 758, 1236, 1714; the odd ones hold two phones and start at y -431.
    const cols = [[-198, 124, 1], [280, -431, 2], [758, 124, 1], [1236, -431, 2], [1714, 124, 1]];
    let n = 0;
    return `
      <div class="v2f-root v2f-g32 v2f-so-wallroot">
        <div class="v2f-so-wall">${cols.map(([x, y, c]) => `<div class="wc" style="left:${x}px;top:${y}px;gap:64px;">${Array.from({ length: c }, () => soPhone(k, at(n++))).join("")}</div>`).join("")}</div>
        <div class="v2f-so-wallhead">${topBar(s.meta, { logoOnly: true })}</div>
      </div>`;
  },
};
