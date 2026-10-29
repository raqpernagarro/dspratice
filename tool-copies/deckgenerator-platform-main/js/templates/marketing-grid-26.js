// Template: marketing/grid-26 — an eyebrow, title, muted subtitle and paragraph at the left, and three full-height phones at the right each showing a post, with a label and a line of text underneath.
// Source Figma frame 110:31131.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-26", slide: 346, figmaNode: "110:31131",
  family: "marketing", role: "showcase", shape: "row", theme: "light", chrome: false,
  use: "Three phones with social posts side by side, each captioned",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 5, subtitles: 1, body: 4, stats: 0, icons: 0 },
  description: "marketing/grid-26 — an eyebrow, title, muted subtitle and paragraph at the left, and three full-height phones at the right each showing a post, with a label and a line of text underneath.",
  intent: {
    bestFor: ["comparing three social executions (for example global and local) as they appear on a phone"],
    holds: "an eyebrow, a title, a subtitle, a paragraph of up to about 300 characters and three phones with a label and a line of up to about 40 characters",
    itemChars: 40,
    avoid: ["more or fewer than three phones", "no images"],
    feel: "visual",
    needs: ["3 images"],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", body: "string", phones: "array of 3 {image, label, text}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Messaging", title: "Benchmark", subtitle: "Global & Local",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    phones: [1, 2, 3].map((i) => ({ image: mkPhoto(i), label: "Local", text: "Lorem ipsum dolor sit amet" })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "39" },
    footer: MK_FOOTER,
  },
  render(s) {
    const left = mkCol(s.meta, `<div class="v2f-mk-ph bottom" style="flex:1 1 0;"><div class="hd">
        ${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<div><p class="v2f-cs-h2">${esc(s.title ?? "")}</p><p class="v2f-cs-h2 v2f-cs-muted">${esc(s.subtitle ?? "")}</p></div></div><p class="par" style="color:var(--fg-50,rgba(1,7,22,.5));">${esc(s.body ?? "")}</p></div>`, { width: 532, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}
          <div class="v2f-mk-3ph">${(s.phones || []).slice(0, 3).map((p) => `<div class="ph">${mkPhonePost(p.image)}<div class="tx"><p class="l">${esc(p.label ?? "")}</p><p class="d">${esc(p.text ?? "")}</p></div></div>`).join("")}</div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
