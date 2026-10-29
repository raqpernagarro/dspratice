// Template: marketing/grid-34 — a small header, then a timeline of up to four weeks on an arrowed line and one row per platform with small captioned thumbnails in the week they run. Also covers the single-week version.
// Source Figma frame 110:31391.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, mkPostCard, mkTick, mkCross, mkStepLine, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-34", slide: 354, figmaNode: "110:31391",
  family: "marketing", role: "timeline", shape: "timeline", theme: "light", chrome: false,
  use: "A content calendar: platforms down the side, weeks across, thumbnails in each cell",
  media: ["photo"], capacity: { items: 3, min: 1, max: 4 },
  slots: { images: 20, titles: 2, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "marketing/grid-34 — a small header, then a timeline of up to four weeks on an arrowed line and one row per platform with small captioned thumbnails in the week they run. Also covers the single-week version.",
  intent: {
    bestFor: ["a content calendar across platforms (Instagram, TikTok, LinkedIn) for a campaign of one to four weeks"],
    holds: "a title and subtitle, one to four weeks, and up to four platform rows with up to three thumbnails per week (image, caption of up to about 10 characters and a shape)",
    itemChars: 10,
    avoid: ["more than four weeks", "more than three thumbnails per cell"],
    feel: "dense",
    needs: ["photos"],
  },
  schema: {
    title: "string", subtitle: "string", weeks: "array of 1–4 strings", rows: "array of {label, cells: [[{image, caption, kind}]] per week} — kind: portrait | short | flat | wide | banner",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Content timeline", subtitle: "Campaign", weeks: ["Week 1", "Week 2", "Week 3", "Week 4"],
    rows: [
      { label: "Instagram", cells: [[["portrait"], ["short"], ["short"]], [["short"], ["short"], ["portrait"]], [["short"], ["short"]], [["short"], ["short"]]] },
      { label: "TikTok", cells: [[["portrait"], ["portrait"]], [["portrait"]], [["portrait"], ["portrait"], ["portrait"]], [["portrait"]]] },
      { label: "LinkedIn", cells: [[["flat"]], [["wide"]], [["flat"], ["flat"]], [["banner"]]] },
    ].map((r) => ({ label: r.label, cells: r.cells.map((c, w) => c.map(([kind], i) => ({ kind, caption: "Lorem", image: mkPhoto(w + i) }))) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "47" },
    footer: MK_FOOTER,
  },
  render(s) {
    const wk = (s.weeks || []).slice(0, 4); const rows = (s.rows || []).slice(0, 4);
    const D = { portrait: [96, 168], short: [96, 118], flat: [96, 120], wide: [150, 120], banner: [212, 120] };
    const cell = (c = []) => `<div class="wc">${c.slice(0, 3).map((x) => { const d = D[x.kind] || D.short; return `<div class="th"><div class="v2f-imgbox v2f-cs-img" style="flex:none;width:${d[0]}px;height:${d[1]}px;">${x.image ? `<img src="${esc(x.image)}" alt="">` : ""}</div><p>${esc(x.caption ?? "")}</p></div>`; }).join("")}</div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkSmallHead({ title: s.title, subtitle: s.subtitle }, { mid: true, md: true })}
        <div class="v2f-mk-cal reveal">
          <div class="ch"><span class="lb"></span>${wk.map((w) => `<div class="wk"><p>${esc(w)}</p><i></i></div>`).join("")}<b class="ln"></b></div>
          ${rows.map((r) => `<div class="cr"><div class="lb">${esc(r.label ?? "")}</div>${wk.map((_, i) => cell((r.cells || [])[i])).join("")}</div>`).join("")}
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
