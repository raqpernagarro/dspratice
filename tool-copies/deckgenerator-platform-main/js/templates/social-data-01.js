// Template: social/data-01 — a title over a centred row of three or four phones showing stories or posts.
// Source Figma frame 110:22318.
// Also covers social/data-02 (four phones) (same layout, a different phone), via `kind`.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/data-01", slide: 362, figmaNode: "110:22318",
  family: "social", role: "gallery", shape: "row", theme: "light", chrome: false,
  use: "Row of three or four stories or posts under a title",
  media: ["photo"], capacity: { items: 4, min: 3, max: 4 },
  slots: { images: 4, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "social/data-01 — a title over a centred row of three or four phones showing stories or posts.",
  intent: {
    bestFor: ["showing a story sequence or a set of posts side by side"],
    holds: "a title and three or four images",
    avoid: ["captions per phone (use social/data-03)", "more than four phones"],
    feel: "visual",
    needs: ["3+ images"],
  },
  schema: {
    title: "string", images: "array of 3 or 4 urls", kind: `"post" | "story" | "tiktok" — the phones shown (default story)`,
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Title", images: [soPhoto(1), soPhoto(2), soPhoto(3)], kind: "story",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "03" },
    footer: SO_FOOTER,
  },
  render(s) {
    const k = soKind(s.kind, ["post", "story", "tiktok"], "story");
    const im = (s.images || []).slice(0, 4);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${soHead({ title: s.title })}</div>
        <div class="v2f-so-row reveal" style="gap:${im.length > 3 ? 64 : 80}px;">${im.map((x) => soPhone(k, x, { scale: 0.9231 })).join("")}</div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
