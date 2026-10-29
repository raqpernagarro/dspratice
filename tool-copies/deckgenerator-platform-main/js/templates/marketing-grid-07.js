// Template: marketing/grid-07 — an eyebrow, title and paragraph over a five-row table with a year header, beside a full-height photo.
// Source Figma frame 110:30627.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-07", slide: 321, figmaNode: "110:30627",
  family: "marketing", role: "table", shape: "split", theme: "light", chrome: false,
  use: "A forecast table with a heading, beside a tall photo",
  media: ["photo"], capacity: { items: 4, min: 2, max: 4 },
  slots: { images: 1, titles: 2, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "marketing/grid-07 — an eyebrow, title and paragraph over a five-row table with a year header, beside a full-height photo.",
  intent: {
    bestFor: ["a market-size or growth forecast over five periods"],
    holds: "an eyebrow, a title, a paragraph, a header row of up to five periods and up to four data rows with a label and five values, and a photo",
    itemChars: 20,
    avoid: ["more than five periods", "long row labels"],
    feel: "dense",
    needs: ["a photo"],
  },
  schema: {
    caption: "string", title: "string", body: "string — paragraph, line breaks kept", columns: "array of up to 5 period labels", rows: "array of up to 4 {label, values: string[]}", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market insights", title: "Market size forecast",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed\ndo eiusmod tempor incididunt ut labore et dolore magna\naliqua. Ut enim ad minim veniam, quis nostrud exercitation\nullamco laboris nisi ut aliquip ex ea commodo consequat.",
    columns: ["2025", "2026", "2027", "2028", "2029"],
    rows: [{ label: "Total", values: ["120", "145", "175", "205", "240"] }, { label: "Category 1", values: ["50", "60", "70", "80", "92"] },
      { label: "Category 2", values: ["30", "37", "45", "53", "62"] }, { label: "Category 3", values: ["40", "48", "60", "72", "86"] }],
    image: mkPhoto(6),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "14" },
    footer: MK_FOOTER,
  },
  render(s) {
    const cols = (s.columns || []).slice(0, 5);
    const rows = (s.rows || []).slice(0, 4);
    const cell = (t, c = "") => `<div class="c ${c}">${esc(t ?? "")}</div>`;
    const table = `<div class="v2f-mk-tbl">
      <div class="r head">${cell("", "f")}${cols.map((c) => cell(c)).join("")}</div>
      ${rows.map((r) => `<div class="r">${cell(r.label, "f")}${cols.map((_, i) => cell((r.values || [])[i])).join("")}</div>`).join("")}
    </div>`;
    const left = mkCol(s.meta, `
      <div class="v2f-mk-h244">${mkPageHead({ caption: s.caption, title: s.title, body: s.body }, { center: true })}</div>
      ${table}`, { width: 904 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}${mkImg(s.image)}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
