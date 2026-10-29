// Template: social/split-03 — an eyebrow, title and paragraph in a left column; at the right a large phone showing a post, cropped by a tinted panel.
// Source Figma frame 110:22398.
// Also covers social/split-06 (story) (same layout, a different phone), via `kind`.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/split-03", slide: 368, figmaNode: "110:22398",
  family: "social", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "One post or story, large, with a short explanation",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "social/split-03 — an eyebrow, title and paragraph in a left column; at the right a large phone showing a post, cropped by a tinted panel.",
  intent: {
    bestFor: ["explaining one post or story with a short description"],
    holds: "an eyebrow (the format), a title, a paragraph of up to about 250 characters and 1 image",
    itemChars: 250,
    avoid: ["long paragraphs", "several points (use social/grid-04)"],
    feel: "visual",
    needs: ["1 image"],
  },
  schema: {
    eyebrow: "string", title: "string", body: "string", image: "url — the post in the phone", kind: `"post" | "story" — the phone shown (default post)`,
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    eyebrow: "Instagram post", title: "Title", body: SO_LOREM, image: soPhoto(1), kind: "post",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "09" },
    footer: SO_FOOTER,
  },
  render(s) {
    const k = soKind(s.kind, ["post", "story"], "post");
    const at = k === "tiktok" ? [361, 46, 1] : [277, 48, 1.4158];
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">
          <div class="v2f-so-lcol">${topBar(s.meta)}${soHead({ eyebrow: s.eyebrow, title: s.title, body: s.body }, { bottom: true })}</div>
          <div class="v2f-so-panel"><div class="at" style="left:${at[0]}px;top:${at[1]}px;">${soPhone(k, s.image, { scale: at[2] })}</div></div>
        </div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
