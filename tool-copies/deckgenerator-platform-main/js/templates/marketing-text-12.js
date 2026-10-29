// Template: marketing/text-12 — a header and a short summary at the left with two small figures at the bottom, and a large tinted panel at the right with a centered 60px statement.
// Source Figma frame 110:30779.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";
import { metric } from "../metric-blocks.js";

export default {
  name: "marketing/text-12", slide: 330, figmaNode: "110:30779",
  family: "marketing", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "A column of key figures beside one statement on a tinted panel",
  media: [], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 0, titles: 3, subtitles: 1, body: 3, stats: 2, icons: 0 },
  description: "marketing/text-12 — a header and a short summary at the left with two small figures at the bottom, and a large tinted panel at the right with a centered 60px statement.",
  intent: {
    bestFor: ["one headline statistic framed as a statement, supported by two quick figures"],
    holds: "a title, subtitle and summary of up to about 80 characters, two figures with a one-line description, and a statement of up to about 70 characters with a one-word label",
    itemChars: 70,
    avoid: ["long statements", "more than two supporting figures"],
    feel: "statement",
    needs: [],
  },
  schema: {
    title: "string", subtitle: "string", body: "string", metrics: "array of 2 {value, text}", label: "string", statement: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Insights", subtitle: "Audience", body: "Summarize the key insights about your audience’s needs and behaviors.",
    metrics: [{ value: "1 in 2", text: "customers researches online before buying" }, { value: "2 in 3", text: "say convenience drives their choice" }],
    label: "Market", statement: "1 in 3 consumers say social media ads influence their first purchase.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "23" },
    footer: MK_FOOTER,
  },
  render(s) {
    const left = mkCol(s.meta, `
      <div class="v2f-mk-h168"><div class="v2f-mk-ph"><div class="hd"><p class="v2f-cs-h4">${esc(s.title ?? "")}</p><p class="v2f-cs-h4 v2f-cs-muted" style="margin-top:-12px">${esc(s.subtitle ?? "")}</p></div><p class="par" style="color:var(--fg-50,rgba(1,7,22,.5));">${esc(s.body ?? "")}</p></div></div>
      <div class="v2f-mk-m2">${(s.metrics || []).slice(0, 2).map((m) => metric({ value: m.value, label: m.text }, { size: "small" })).join("")}</div>`, { width: 600 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}
          <div class="v2f-mk-panel"><div class="v2f-mk-cmid">${s.label ? `<p class="l2">${esc(s.label)}</p>` : ""}<p class="st">${esc(s.statement ?? "")}</p></div></div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
