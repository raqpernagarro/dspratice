// Template: social/grid-04 — an eyebrow and title with three do’s (tick, title, line) in a left column; at the right a phone showing the post on a tinted panel.
// Source Figma frame 110:22449.
// Also covers social/grid-06 (TikTok) (same layout, a different phone), via `kind`.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/grid-04", slide: 371, figmaNode: "110:22449",
  family: "social", role: "detail", shape: "split", theme: "light", chrome: false,
  use: "Do’s for a post format, beside an example in a phone",
  media: ["photo"], capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 1, titles: 4, subtitles: 1, body: 3, stats: 0, icons: 3 },
  description: "social/grid-04 — an eyebrow and title with three do’s (tick, title, line) in a left column; at the right a phone showing the post on a tinted panel.",
  intent: {
    bestFor: ["the rules to follow for a post or TikTok format, next to an example"],
    holds: "an eyebrow (the format), a title, two or three rules with a title and a line of up to about 90 characters, and one image",
    itemChars: 90,
    avoid: ["more than three rules", "long rule text"],
    feel: "dense",
    needs: ["1 image"],
  },
  schema: {
    eyebrow: "string", title: "string", rules: "array of up to 3 {title, text}", image: "url — the post in the phone",
    kind: `"post" | "tiktok" — the phone shown (default post)`, tone: `"do" | "dont" — tick or cross icons (default do)`,
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    eyebrow: "Instagram post", title: "Do’s", image: soPhoto(1), kind: "post", tone: "do",
    rules: [1, 2, 3].map(() => ({ title: "Title", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "12" },
    footer: SO_FOOTER,
  },
  render(s) {
    const k = soKind(s.kind, ["post", "tiktok"], "post");
    const tone = s.tone === "dont" ? "dont" : "do";
    const at = k === "tiktok" ? [361, 46, 1] : [277, 48, 1.4158];
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">
          <div class="v2f-so-lcol">${topBar(s.meta)}${soHead({ eyebrow: s.eyebrow, title: s.title })}<div class="v2f-so-list">${(s.rules || []).slice(0, 3).map((r) => soRule(r, tone)).join("")}</div></div>
          <div class="v2f-so-panel"><div class="at" style="left:${at[0]}px;top:${at[1]}px;">${soPhone(k, s.image, { scale: at[2] })}</div></div>
        </div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
