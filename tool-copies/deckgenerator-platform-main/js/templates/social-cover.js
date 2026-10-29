// Template: social/cover — cover with a caption, a large title and a muted subtitle at the top left and a phone showing a post in the middle of the slide.
// Source Figma frame 110:22286.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/cover", slide: 360, figmaNode: "110:22286",
  family: "social", role: "cover", shape: "single", theme: "light", chrome: false,
  use: "Cover for a social media plan or content proposal",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 2, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "social/cover — cover with a caption, a large title and a muted subtitle at the top left and a phone showing a post in the middle of the slide.",
  intent: {
    bestFor: ["opening a social media plan, campaign or content proposal"],
    holds: "a caption, a title, a subtitle and one post image",
    itemChars: 20,
    avoid: ["no post image", "long titles"],
    feel: "visual",
    needs: ["1 image"],
  },
  schema: {
    caption: "string", title: "string — up to about 20 characters", subtitle: "string", image: "url — the post in the phone",
    kind: `"post" | "story" | "tiktok" — the phone shown (default post)`,
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Intro", subtitle: "Subtitle", image: soPhoto(1), kind: "post",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
    footer: SO_FOOTER,
  },
  render(s) {
    const k = soKind(s.kind, ["post", "story", "tiktok"], "post");
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-so-plainhead">${topBar(s.meta, { logoOnly: true })}</div>
        <div class="reveal">${soBigHead({ caption: s.caption, title: s.title, subtitle: s.subtitle })}</div>
        <div class="v2f-so-cover reveal">${soPhone(k, s.image, { scale: 1.071 })}</div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
