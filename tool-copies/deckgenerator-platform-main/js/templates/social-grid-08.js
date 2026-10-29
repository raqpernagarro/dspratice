// Template: social/grid-08 — a large phone showing a post, cropped by a tinted panel at the left; at the right an eyebrow and title over posting details (caption, hashtags, location, time).
// Source Figma frame 110:22489.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/grid-08", slide: 373, figmaNode: "110:22489",
  family: "social", role: "detail", shape: "split", theme: "light", chrome: false,
  use: "A post with its posting details: caption, hashtags, location, time",
  media: ["photo"], capacity: { items: 4, min: 2, max: 5 },
  slots: { images: 1, titles: 5, subtitles: 1, body: 4, stats: 0, icons: 0 },
  description: "social/grid-08 — a large phone showing a post, cropped by a tinted panel at the left; at the right an eyebrow and title over posting details (caption, hashtags, location, time).",
  intent: {
    bestFor: ["the brief for a single scheduled post"],
    holds: "an eyebrow, a title, two to five label and value pairs (values up to about 90 characters) and one image",
    itemChars: 90,
    avoid: ["long values", "more than five details"],
    feel: "dense",
    needs: ["1 image"],
  },
  schema: {
    eyebrow: "string", title: "string", fields: "array of up to 5 {label, value}", image: "url — the post in the phone",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    eyebrow: "Instagram post", title: "Guidelines", image: soPhoto(1),
    fields: [{ label: "Caption", value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt." }, { label: "Hashtags", value: "#hashtag" }, { label: "Location", value: "New York City" }, { label: "Time", value: "10 PM" }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "14" },
    footer: SO_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">
          <div class="v2f-so-panel"><div class="at" style="left:277px;top:48px;">${soPhone("post", s.image, { scale: 1.4158 })}</div></div>
          <div class="v2f-so-lcol">${topBar(s.meta)}${soHead({ eyebrow: s.eyebrow, title: s.title })}<div class="v2f-so-list">${(s.fields || []).slice(0, 5).map(soField).join("")}</div></div>
        </div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
