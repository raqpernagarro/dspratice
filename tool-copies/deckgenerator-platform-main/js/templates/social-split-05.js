// Template: social/split-05 — an eyebrow, title and paragraph in a left column; at the right two phones showing posts or stories on a tinted panel.
// Source Figma frame 110:22412.
// Also covers social/split-09 (stories) (same layout, a different phone), via `kind`.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/split-05", slide: 370, figmaNode: "110:22412",
  family: "social", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "Two posts or stories side by side with a short explanation",
  media: ["photo"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "social/split-05 — an eyebrow, title and paragraph in a left column; at the right two phones showing posts or stories on a tinted panel.",
  intent: {
    bestFor: ["explaining one pair of posts or stories with a short description"],
    holds: "an eyebrow (the format), a title, a paragraph of up to about 250 characters and 2 images",
    itemChars: 250,
    avoid: ["long paragraphs", "several points (use social/grid-04)"],
    feel: "visual",
    needs: ["2 images"],
  },
  schema: {
    eyebrow: "string", title: "string", body: "string", images: "array of 2 urls", kind: `"post" | "story" — the phones shown (default post)`,
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    eyebrow: "Instagram posts", title: "Title", body: SO_LOREM, images: [soPhoto(1), soPhoto(2)], kind: "post",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "11" },
    footer: SO_FOOTER,
  },
  render(s) {
    const k = soKind(s.kind, ["post", "story"], "post");
    const im = s.images || [];
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">
          <div class="v2f-so-lcol">${topBar(s.meta)}${soHead({ eyebrow: s.eyebrow, title: s.title, body: s.body }, { bottom: true })}</div>
          <div class="v2f-so-panel">${[[121, 46], [601, 46]].map(([x, y], i) => `<div class="at" style="left:${x}px;top:${y}px;">${soPhone(k, im[i])}</div>`).join("")}</div>
        </div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
