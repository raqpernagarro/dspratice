// Template: social/grid-05 — a phone showing the post on a tinted panel at the left; at the right an eyebrow and title with three don’ts (cross, title, line).
// Source Figma frame 110:22459.
// Also covers social/grid-07 (TikTok) (same layout, a different phone), via `kind`.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/grid-05", slide: 372, figmaNode: "110:22459",
  family: "social", role: "detail", shape: "split", theme: "light", chrome: false,
  use: "Don’s for a post format, beside an example in a phone",
  media: ["photo"], capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 1, titles: 4, subtitles: 1, body: 3, stats: 0, icons: 3 },
  description: "social/grid-05 — a phone showing the post on a tinted panel at the left; at the right an eyebrow and title with three don’ts (cross, title, line).",
  intent: {
    bestFor: ["the mistakes to avoid for a post or TikTok format, next to an example"],
    holds: "an eyebrow (the format), a title, two or three rules with a title and a line of up to about 90 characters, and one image",
    itemChars: 90,
    avoid: ["more than three rules", "long rule text"],
    feel: "dense",
    needs: ["1 image"],
  },
  schema: {
    eyebrow: "string", title: "string", rules: "array of up to 3 {title, text}", image: "url — the post in the phone",
    kind: `"post" | "tiktok" — the phone shown (default post)`, tone: `"do" | "dont" — tick or cross icons (default dont)`,
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    eyebrow: "Instagram post", title: "Don’ts", image: soPhoto(1), kind: "post", tone: "dont",
    rules: [1, 2, 3].map(() => ({ title: "Title", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "13" },
    footer: SO_FOOTER,
  },
  render(s) {
    const k = soKind(s.kind, ["post", "tiktok"], "post");
    const tone = s.tone === "do" ? "do" : "dont";
    const at = k === "tiktok" ? [361, 46, 1] : [277, 48, 1.4158];
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">
          <div class="v2f-so-panel"><div class="at" style="left:${at[0]}px;top:${at[1]}px;">${soPhone(k, s.image, { scale: at[2] })}</div></div>
          <div class="v2f-so-lcol">${topBar(s.meta)}${soHead({ eyebrow: s.eyebrow, title: s.title })}<div class="v2f-so-list">${(s.rules || []).slice(0, 3).map((r) => soRule(r, tone)).join("")}</div></div>
        </div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
