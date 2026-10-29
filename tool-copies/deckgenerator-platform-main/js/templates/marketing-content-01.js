// Template: marketing/content-01 — section divider — the chapter title at the left and its number at the right, on an otherwise empty slide.
// Source Figma frame 110:30492.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkTocTile, mkTocRow, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/content-01", slide: 311, figmaNode: "110:30492",
  family: "marketing", role: "divider", shape: "single", theme: "light", chrome: false,
  use: "Section divider: chapter title with its number",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "marketing/content-01 — section divider — the chapter title at the left and its number at the right, on an otherwise empty slide.",
  intent: {
    bestFor: ["opening each chapter of a longer marketing deck"],
    holds: "a chapter title of up to about 30 characters and its two-digit number",
    itemChars: 30,
    avoid: ["content of any kind", "use as a title slide"],
    feel: "statement",
    needs: [],
  },
  schema: {
    title: "string — chapter title", number: "string — chapter number",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Context", number: "01",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "04" },
    footer: MK_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-div reveal"><p class="t">${esc(s.title ?? "")}</p><p class="n">${esc(s.number ?? "")}</p></div>
        <div style="flex:1 1 0;"></div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
