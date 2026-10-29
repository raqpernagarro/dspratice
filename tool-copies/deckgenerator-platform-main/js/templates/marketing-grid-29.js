// Template: marketing/grid-29 — an eyebrow, title and subtitle, then a week header (three tinted cells) and one tall labelled row per audience with dark bars placed across the weeks.
// Source Figma frame 110:31211.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, mkPostCard, mkTick, mkCross, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-29", slide: 349, figmaNode: "110:31211",
  family: "marketing", role: "timeline", shape: "timeline", theme: "light", chrome: false,
  use: "A content funnel over three weeks, with tracks for each audience and bars for the activities",
  media: [], capacity: { items: 2, min: 1, max: 3 },
  slots: { images: 0, titles: 4, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "marketing/grid-29 — an eyebrow, title and subtitle, then a week header (three tinted cells) and one tall labelled row per audience with dark bars placed across the weeks.",
  intent: {
    bestFor: ["planning what content runs when for each audience segment across three weeks"],
    holds: "an eyebrow, a title, a subtitle, three weeks and one to three audiences, each with up to five activities (a label of up to about 24 characters, a start and an end in weeks, and a lane)",
    itemChars: 24,
    avoid: ["more than three audiences", "activity labels longer than 24 characters"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", weeks: "array of 3 strings", rows: "array of {label, top?, bars: [{label, from, to, lane}]} — from/to are 0–3 (whole numbers are week boundaries), lane 0 or 1",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Content", title: "Content", subtitle: "Funnel", weeks: ["Week 1", "Week 2", "Week 3"],
    rows: [
      { label: "Gen Z", bars: [{ label: "Social teasers", from: 0, to: 0.51, lane: 0 }, { label: "Brand film", from: 0.5, to: 0.79, lane: 1 }, { label: "Social activations", from: 1, to: 1.92, lane: 0 }, { label: "On site activations", from: 2, to: 2.92, lane: 0 }] },
      { label: "Millenials", top: 20, bars: [{ label: "Social teasers", from: 0, to: 0.51, lane: 0 }, { label: "Gamification experience", from: 1.01, to: 2.9, lane: 0 }] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "42" },
    footer: MK_FOOTER,
  },
  render(s) {
    // Figma 110:31211 — week cells 692 / 476 / 476 (gap 16) after a 148px label column.
    const ST = [0, 708, 1200], WD = [692, 476, 476];
    const X = (u) => { const k = Math.min(2, Math.floor(Math.max(0, u))); return Math.round(ST[k] + (Math.max(0, u) - k) * WD[k]); };
    const wk = (s.weeks || []).slice(0, 3);
    const rows = (s.rows || []).slice(0, 3);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h152 reveal"><div class="v2f-mk-ph center"><div class="hd">
          ${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<div><p class="v2f-cs-h2">${esc(s.title ?? "")}</p>${s.subtitle ? `<p class="v2f-cs-h4 v2f-cs-muted">${esc(s.subtitle)}</p>` : ""}</div></div></div></div>
        <div class="v2f-mk-gantt reveal">
          <div class="wh"><span class="lb"></span>${wk.map((w, i) => `<span class="w" style="flex:0 0 ${WD[i]}px">${esc(w)}</span>`).join("")}</div>
          ${rows.map((r) => `<div class="gr"><span class="lb"><i>${esc(r.label ?? "")}</i></span><div class="bd">${(r.bars || []).map((b) => { const x = X(b.from), x2 = X(b.to); return `<span class="bar" style="left:${x}px;width:${Math.max(40, x2 - x)}px;top:${(r.top ?? 42) + (b.lane || 0) * 62}px">${esc(b.label ?? "")}</span>`; }).join("")}</div></div>`).join("")}
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
