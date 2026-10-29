// Template: marketing/grid-27 — a small header and three tick (or cross) rules at the left, and a tinted panel at the right showing two social posts; `mode` switches Do's (green ticks) and Don't's (red crosses).
// Source Figma frame 110:31162.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, mkPostCard, mkTick, mkCross, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-27", slide: 348, figmaNode: "110:31162",
  family: "marketing", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "Do's or Don't's: three rules at the left, two example posts on a panel at the right",
  media: ["photo"], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 2, titles: 5, subtitles: 1, body: 3, stats: 0, icons: 3 },
  description: "marketing/grid-27 — a small header and three tick (or cross) rules at the left, and a tinted panel at the right showing two social posts; `mode` switches Do's (green ticks) and Don't's (red crosses).",
  intent: {
    bestFor: ["social guidelines: three do's (or don't's) shown with two example posts"],
    holds: "a title and subtitle, three rules with a one-word label and a sentence of up to about 130 characters, and two images",
    itemChars: 130,
    avoid: ["more than three rules", "no images"],
    feel: "visual",
    needs: ["2 images"],
  },
  schema: {
    mode: "\"do\" | \"dont\"", title: "string", subtitle: "string", rules: "array of 3 {label, text}", images: "array of 2 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    mode: "do", title: "Do’s", subtitle: "Messaging",
    rules: [1, 2, 3].map(() => ({ label: "Do", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." })),
    images: [1, 2].map((i) => mkPhoto(i)),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "41" },
    footer: MK_FOOTER,
  },
  render(s) {
    const dont = s.mode === "dont"; const im = s.images || [];
    const left = mkCol(s.meta, `
      ${mkSmallHead({ title: s.title ?? (dont ? "Don’ts" : "Do’s"), subtitle: s.subtitle }, { mid: true })}
      <div class="v2f-mk-rules">${(s.rules || []).slice(0, 3).map((r) => `<div class="ru"><div class="ti">${dont ? mkCross(28) : mkTick(28)}<p>${esc(r.label ?? (dont ? "Don’t" : "Do"))}</p></div><p class="b">${esc(r.text ?? "")}</p></div>`).join("")}</div>`, { width: 597, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:40px;">${left}
          <div class="v2f-mk-panel2">${mkPostCard(im[0])}${mkPostCard(im[1])}</div></div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
