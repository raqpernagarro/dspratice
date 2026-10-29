// Template: finance/statement-list — a SectionHeader over a stack of triangle-
// bulleted headline statements, with a supporting image on the right. Light theme.
// Source Figma frame 110:18224 (finance/grid-02).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { finStatementList } from "../finance-blocks.js";
import { SAMPLE } from "../blocks.js";

export default {
  name: "finance/statement-list",
  slide: 119,
  figmaNode: "110:18224",
  family: "finance",
  role: "content",
  shape: "list",
  theme: "light",
  chrome: false,
  use: "A header, then a short stack of headline statements (each a bold metric sentence), with a supporting image alongside.",
  media: ["image"],
  capacity: { items: 3, min: 2, max: 4 },
  slots: { images: 1, titles: 1, body: 3, stats: 0, icons: 0 },
  description: "finance/statement-list — SectionHeader + triangle-bulleted headline statements + image.",
  schema: {
    caption: "string — eyebrow", title: "string — heading",
    items: "array of string — headline statements",
    image: "string — supporting image url",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "FY 2024", title: "Highlights",
    items: [
      "Revenue grew +18% Y/Y to $525 million",
      "US revenue grew +23% Y/Y to $337 million",
      "US commercial revenue grew +26% Y/Y and +39% Q/Q to $107 million",
    ],
    image: SAMPLE[11],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "286" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-fin-imgsplit reveal">
        <div class="v2f-fin-imgleft">
          ${topBar(s.meta)}
          <div class="v2f-fin-imghead">
            ${s.caption ? `<p class="v2f-caption">${esc(s.caption)}</p>` : ""}
            ${s.title ? `<p class="v2f-title">${esc(s.title)}</p>` : ""}
          </div>
          ${finStatementList(s.items || [])}
        </div>
        <div class="v2f-fin-imgfull">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
