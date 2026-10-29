// Template: marketing/grid-03 — a column with eyebrow, title and paragraph beside three tinted cards, each with an icon, a title and a description.
// Source Figma frame 110:30507.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkTocTile, mkTocRow, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-03", slide: 314, figmaNode: "110:30507",
  family: "marketing", role: "cards", shape: "split", theme: "light", chrome: false,
  use: "A heading with a paragraph beside three icon cards",
  media: [], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 0, titles: 4, subtitles: 0, body: 4, stats: 0, icons: 3 },
  description: "marketing/grid-03 — a column with eyebrow, title and paragraph beside three tinted cards, each with an icon, a title and a description.",
  intent: {
    bestFor: ["the brief: context, brief and challenge", "three short points that need a sentence each"],
    holds: "an eyebrow, a title of 1–2 words, a paragraph, and three cards with a title of 1–2 words and a description of up to about 200 characters",
    itemChars: 200,
    avoid: ["more or fewer than three cards", "long titles"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string", cards: "array of 3 {icon, title, body}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Context", title: "Brief", body: MK_LOREM,
    cards: [{ title: "Context", body: MK_LOREM }, { title: "Brief", body: MK_LOREM }, { title: "Challenge", body: MK_LOREM }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "07" },
    footer: MK_FOOTER,
  },
  render(s) {
    const left = mkCol(s.meta, `
      <div class="v2f-mk-lhead">
        ${mkHead({ caption: s.caption, title: s.title }, { size: "h2" })}
        ${s.body ? `<p class="v2f-mk-para">${esc(s.body)}</p>` : ""}
      </div>`, { width: 650 });
    const cards = (s.cards || []).slice(0, 3).map((c) => mkCard(`
      ${mkIcon(c.icon || "person-checkmark")}
      <p class="v2f-cs-h4 v2f-mk-ct">${esc(c.title ?? "")}</p>
      <p class="v2f-mk-cb">${esc(c.body ?? "")}</p>`, { cls: "v2f-mk-row" })).join("");
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:24px;">${left}<div class="v2f-mk-stack">${cards}</div></div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
