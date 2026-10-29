// Template: marketing/text-04 — a small page header over a 2×2 grid of tinted cards, each with an icon, an eyebrow, a title and a sentence.
// Source Figma frame 110:30517.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-04", slide: 315, figmaNode: "110:30517",
  family: "marketing", role: "cards", shape: "grid", theme: "light", chrome: false,
  use: "Four insight cards, each with an icon, a category, a title and a sentence",
  media: [], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 0, titles: 5, subtitles: 1, body: 4, stats: 0, icons: 4 },
  description: "marketing/text-04 — a small page header over a 2×2 grid of tinted cards, each with an icon, an eyebrow, a title and a sentence.",
  intent: {
    bestFor: ["presenting four market or audience insights side by side"],
    holds: "a title, a subtitle, and four cards with an eyebrow of 1–2 words, a title of up to about 24 characters and a sentence of up to about 130 characters",
    itemChars: 130,
    avoid: ["more or fewer than four insights", "long titles"],
    feel: "dense",
    needs: [],
  },
  schema: {
    title: "string", subtitle: "string", cards: "array of 4 {icon, caption, title, body}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Insights", subtitle: "Market",
    cards: [["Context", "Market Landscape"], ["Culture", "Trends"], ["Consumer", "Audience Insights"], ["Company", "Brand Position"]]
      .map(([caption, title]) => ({ caption, title, body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "08" },
    footer: MK_FOOTER,
  },
  render(s) {
    const cards = (s.cards || []).slice(0, 4).map((c) => mkCard(`
      ${mkIcon(c.icon || "person-checkmark")}
      <div class="v2f-mk-ctitle">
        ${c.caption ? `<p class="cap">${esc(c.caption)}</p>` : ""}
        <p class="v2f-cs-h4">${esc(c.title ?? "")}</p>
      </div>
      <p class="v2f-mk-cbody">${esc(c.body ?? "")}</p>`, { cls: "v2f-mk-col" })).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkSmallHead({ title: s.title, subtitle: s.subtitle })}
        <div class="v2f-mk-g22 reveal">${cards}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
