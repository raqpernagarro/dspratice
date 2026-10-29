// Template: marketing/text-17 — an eyebrow, title, muted subtitle and paragraph at the left; at the right a phone showing a social post and two tall example images.
// Source Figma frame 110:31121.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-17", slide: 345, figmaNode: "110:31121",
  family: "marketing", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "A benchmark in a phone mockup beside two vertical examples",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 3, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "marketing/text-17 — an eyebrow, title, muted subtitle and paragraph at the left; at the right a phone showing a social post and two tall example images.",
  intent: {
    bestFor: ["benchmarking a product-led social approach with the actual post and two more examples"],
    holds: "an eyebrow, a title, a subtitle, a paragraph of up to about 300 characters and three images (the post, then two examples)",
    itemChars: 300,
    avoid: ["no images", "long paragraphs"],
    feel: "visual",
    needs: ["3 images"],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", body: "string", images: "array of 3 — the post in the phone, then two examples",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Messaging", title: "Benchmark", subtitle: "Product led",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: [1, 2, 3].map((i) => mkPhoto(i)),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "38" },
    footer: MK_FOOTER,
  },
  render(s) {
    const im = s.images || [];
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal" style="gap:32px;">
          <div class="v2f-mk-lcol" style="flex:0 0 600px;"><div class="v2f-mk-ph bottom" style="flex:1 1 0;"><div class="hd">
            ${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<div><p class="v2f-cs-h2">${esc(s.title ?? "")}</p><p class="v2f-cs-h2 v2f-cs-muted">${esc(s.subtitle ?? "")}</p></div></div><p class="par">${esc(s.body ?? "")}</p></div></div>
          <div class="v2f-mk-showc">
            <div class="ph">${mkPhonePost(im[0], { scale: 0.8614 })}</div>
            <div class="ex">${mkImg(im[1])}${mkImg(im[2])}</div>
          </div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
