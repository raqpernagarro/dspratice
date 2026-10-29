// Template: marketing/grid-02 — table of contents as a ruled list of up to eight sections with page ranges, beside a rounded photo.
// Source Figma frame 110:30478.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkTocTile, mkTocRow, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-02", slide: 310, figmaNode: "110:30478",
  family: "marketing", role: "toc", shape: "split", theme: "light", chrome: false,
  use: "Table of contents as a ruled list beside a photo",
  media: ["photo"], capacity: { items: 8, min: 3, max: 8 },
  slots: { images: 1, titles: 9, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "marketing/grid-02 — table of contents as a ruled list of up to eight sections with page ranges, beside a rounded photo.",
  intent: {
    bestFor: ["the contents page when a photo sets the tone", "eight sections or fewer"],
    holds: "a heading, three to eight sections with a label of up to about 28 characters and a page range, and one photo",
    itemChars: 28,
    avoid: ["more than eight sections", "no photo available"],
    feel: "dense",
    needs: ["a photo"],
  },
  schema: {
    title: "string — the page heading", items: "array of {label, pages} — up to 8", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Table of Contents", image: mkPhoto(1),
    items: [["Context", "4 – 7"], ["Market insights", "8 – 17"], ["Audience insights", "18 – 27"], ["Content strategy", "28 – 39"],
      ["Deliverables", "40 – 43"], ["Messaging", "44 – 52"], ["Content roll-out", "53 – 63"], ["KPI / Goals", "64 – 67"]]
      .map(([label, pages]) => ({ label, pages })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "03" },
    footer: MK_FOOTER,
  },
  render(s) {
    const left = mkCol(s.meta, `
      <p class="v2f-cs-h4 v2f-cs-muted v2f-mk-pgt">${esc(s.title ?? "Table of Contents")}</p>
      <div class="v2f-mk-toclist">${(s.items || []).slice(0, 8).map(mkTocRow).join("")}</div>`);
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">${left}${mkImg(s.image)}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
