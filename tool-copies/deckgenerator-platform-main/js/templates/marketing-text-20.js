// Template: marketing/text-20 — an eyebrow, a three-line 60px headline and a muted explanation at the left; at the right four cards in two staggered columns — dark cards for figures and grey cards for a highlight or a press quote.
// Source Figma frame 110:31677.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-20", slide: 359, figmaNode: "110:31677",
  family: "marketing", role: "results", shape: "grid", theme: "light", chrome: false,
  use: "A headline beside four goal cards: two dark figures and two grey highlights",
  media: [], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 0, titles: 2, subtitles: 0, body: 5, stats: 2, icons: 0 },
  description: "marketing/text-20 — an eyebrow, a three-line 60px headline and a muted explanation at the left; at the right four cards in two staggered columns — dark cards for figures and grey cards for a highlight or a press quote.",
  intent: {
    bestFor: ["the headline goals of a campaign: markets, engagement, subscribers and one piece of earned recognition"],
    holds: "an eyebrow, a headline of up to about 70 characters, an explanation of up to about 100 characters, two figures with a line of up to about 20 characters and two highlights of up to about 60 characters",
    itemChars: 60,
    avoid: ["more or fewer than four cards", "long figures"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string", stats: "array of 2 {text, up?: boolean}", highlights: "array of 2 {text, source?}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "KPI / Goals", title: "Summarize the key milestones that will define project success.",
    body: "Write a brief explanation of why these milestones matter and how they reflect project progress.",
    stats: [{ text: "+X new markets" }, { text: "X Subscribers", up: true }],
    highlights: [{ text: "X% increase in engagement" }, { text: "\"Featured in [Publication] for innovation\"", source: "– Bloomberg" }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "52" },
    footer: MK_FOOTER,
  },
  render(s) {
    const st = s.stats || []; const hl = s.highlights || [];
    const stat = (x = {}) => `<div class="v2f-mk-st" style="flex:1 1 0;"><p>${x.up ? '<img class="up" src="assets/marketing/social/up.svg" alt="">' : ""}${esc(x.text ?? "")}</p></div>`;
    const hi = (x = {}) => `<div class="v2f-mk-hi" style="flex:0 0 317px;"><p class="t">${esc(x.text ?? "")}</p>${x.source ? `<p class="w">${esc(x.source)}</p>` : ""}</div>`;
    const left = mkCol(s.meta, `<div class="v2f-mk-ph bottom" style="flex:1 1 0;"><div class="hd">${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<p class="v2f-cs-h2">${esc(s.title ?? "")}</p></div><p class="par md2">${esc(s.body ?? "")}</p></div>`, { width: 900 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}
          <div class="v2f-mk-2col"><div class="cc">${stat(st[0])}${hi(hl[1])}</div><div class="cc">${hi(hl[0])}${stat(st[1])}</div></div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
