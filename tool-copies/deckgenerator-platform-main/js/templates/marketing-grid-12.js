// Template: marketing/grid-12 — an eyebrow and 60px headline at the left, and three groups of two rounded bars each at the right, with a label above each group and a value under each bar.
// Source Figma frame 110:30803.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-12", slide: 333, figmaNode: "110:30803",
  family: "marketing", role: "chart", shape: "bars", theme: "light", chrome: false,
  use: "A headline beside three paired-bar charts, one per audience",
  media: [], capacity: { items: 6, min: 6, max: 6 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 6, icons: 0 },
  description: "marketing/grid-12 — an eyebrow and 60px headline at the left, and three groups of two rounded bars each at the right, with a label above each group and a value under each bar.",
  intent: {
    bestFor: ["comparing two figures for each of three audiences (for example now versus next year)"],
    holds: "an eyebrow, a headline of up to about 70 characters and three groups with a label and two values",
    itemChars: 12,
    avoid: ["more than three groups", "more than two bars per group"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", groups: "array of 3 {label, bars: [{value, display}] (2)} — bar height is relative to the largest value",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Audience", title: "Highlight the key audience insight revealed by the numbers below",
    groups: [{ label: "Gen Z", bars: [{ value: 20, display: "20M" }, { value: 30, display: "30M" }] }, { label: "Millennials", bars: [{ value: 35, display: "35M" }, { value: 40, display: "40M" }] }, { label: "Total", bars: [{ value: 55, display: "55M" }, { value: 70, display: "70M" }] }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "26" },
    footer: MK_FOOTER,
  },
  render(s) {
    const gs = (s.groups || []).slice(0, 3);
    const max = Math.max(1, ...gs.flatMap((g) => (g.bars || []).map((b) => Number(b.value) || 0)));
    const group = (g) => `<div class="g"><p class="gl">${esc(g.label ?? "")}</p><div class="bars">${(g.bars || []).slice(0, 2).map((b, i) => `
      <div class="b"><div class="plot ${i ? "r" : "l"}"><i class="${i ? "d" : "l"}" style="height:${Math.max(4, Math.round(((Number(b.value) || 0) / max) * 480))}px"></i></div><p class="bv">${esc(b.display ?? b.value ?? "")}</p></div>`).join("")}</div></div>`;
    const left = `<div class="v2f-mk-lcol">${mkPageHead({ caption: s.caption, title: s.title })}</div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}<div class="v2f-mk-bars3">${gs.map(group).join("")}</div></div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
