// Template: marketing/grid-25 — an eyebrow, title and subtitle, then a funnel: four stage headings on an arrowed line with a bullet each, and four labelled rows of two-line cells beneath.
// Source Figma frame 110:31085.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-25", slide: 344, figmaNode: "110:31085",
  family: "marketing", role: "timeline", shape: "table", theme: "light", chrome: false,
  use: "A four-stage funnel with a row of objectives, messaging and content per stage",
  media: [], capacity: { items: 4, min: 3, max: 4 },
  slots: { images: 0, titles: 5, subtitles: 1, body: 16, stats: 0, icons: 0 },
  description: "marketing/grid-25 — an eyebrow, title and subtitle, then a funnel: four stage headings on an arrowed line with a bullet each, and four labelled rows of two-line cells beneath.",
  intent: {
    bestFor: ["mapping messages across the funnel (awareness, consideration, purchase, loyalty)"],
    holds: "an eyebrow, a title, a subtitle, three or four stages with a name of up to about 16 characters and four rows with a label and one two-line cell per stage of up to about 60 characters",
    itemChars: 60,
    avoid: ["more than four stages", "more than four rows"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", stages: "array of up to 4 strings", rows: "array of up to 4 {label, cells: string[] — one per stage}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Messaging", title: "Messaging", subtitle: "Funnel",
    stages: ["Awareness", "Consideration", "Purchase", "Loyalty"],
    rows: ["Objectives", "TBD", "Messaging", "Content mix"].map((label) => ({ label, cells: Array(4).fill("Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit.") })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "37" },
    footer: MK_FOOTER,
  },
  render(s) {
    const st = (s.stages || []).slice(0, 4); const rows = (s.rows || []).slice(0, 4);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h144 reveal"><div class="v2f-mk-ph center"><div class="hd">
          ${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<div><p class="v2f-cs-h2">${esc(s.title ?? "")}</p>${s.subtitle ? `<p class="v2f-cs-h5 v2f-cs-muted">${esc(s.subtitle)}</p>` : ""}</div></div></div></div>
        <div class="v2f-mk-funnel reveal">
          <div class="fh"><div class="lab"></div>${st.map((x) => `<div class="st"><p>${esc(x)}</p><i></i></div>`).join("")}<b class="ln"></b></div>
          <div class="fb">${rows.map((r) => `<div class="fr"><div class="lab">${esc(r.label ?? "")}</div>${st.map((_, i) => `<div class="cl">${esc((r.cells || [])[i] ?? "")}</div>`).join("")}</div>`).join("")}</div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
