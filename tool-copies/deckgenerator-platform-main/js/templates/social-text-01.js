// Template: social/text-01 — a caption, a large title and handle and a paragraph in a left column; at the right an Instagram profile grid in a large phone, cropped by a tinted panel.
// Source Figma frame 110:22391.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/text-01", slide: 367, figmaNode: "110:22391",
  family: "social", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "An Instagram profile grid beside its handle and a description",
  media: ["photo"], capacity: { items: 9, min: 3, max: 15 },
  slots: { images: 9, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "social/text-01 — a caption, a large title and handle and a paragraph in a left column; at the right an Instagram profile grid in a large phone, cropped by a tinted panel.",
  intent: {
    bestFor: ["presenting an account's profile or the planned look of its grid"],
    holds: "a caption, a title, a handle, a paragraph of up to about 250 characters and three or more grid images",
    itemChars: 250,
    avoid: ["long paragraphs", "no images"],
    feel: "visual",
    needs: ["3+ images"],
  },
  schema: {
    caption: "string", title: "string", handle: "string — e.g. @username", body: "string", images: "array of up to 15 urls, read left to right, top to bottom",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Instagram grid", handle: "@username", body: SO_LOREM, images: [soPhoto(1), soPhoto(2), soPhoto(3), soPhoto(4), soPhoto(5), soPhoto(6), soPhoto(7), soPhoto(8), soPhoto(9)],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "08" },
    footer: SO_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">
          <div class="v2f-so-lcol">${topBar(s.meta)}${soBigHead({ caption: s.caption, title: s.title, subtitle: s.handle, body: s.body }, { bottom: true })}</div>
          <div class="v2f-so-panel"><div class="at" style="left:169px;top:48px;">${soPhone("grid", s.images || [])}</div></div>
        </div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
