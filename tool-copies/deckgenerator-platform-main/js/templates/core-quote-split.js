// Template: core/quote-split — an intro panel (heading, pills, paragraphs) on
// the left beside a large quotation on the right. Source Figma frame 109:5471.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { textQuote } from "../blocks.js";

export default {
  name: "core/quote-split",
  slide: 59,
  figmaNode: "109:5471",
  family: "core", role: "quote", shape: "split", theme: "light", chrome: false,
  use: "A heading with context and category pills on the left beside a large quotation on the right.",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/quote-split — left intro panel + right large quotation.",
  schema: {
    caption: "string", title: "string", subtitle: "string",
    pills: "array of category labels", paragraphs: "array of context paragraphs",
    quote: "string — the quotation; wrap key phrases in **double asterisks** to highlight them",
    attribution: "string — source line under the quote",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", subtitle: "Subtitle", pills: ["Badge", "Badge", "Badge"],
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    ],
    quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
    attribution: "Lorem ipsum",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "131" },
  },
  render(s) {
    // Figma 109:5471: a 608px text column (top bar, heading, paragraphs,
    // badges), then the quote 80px down in the remaining 1200px.
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal" style="gap:32px;">
          <div class="v2f-csplit-text" style="width:608px;">
            ${topBar(s.meta)}
            <div class="v2f-heading" style="width:auto;gap:0;">
              ${s.caption ? `<p class="v2f-caption">${esc(s.caption)}</p>` : ""}
              ${s.title ? `<p class="v2f-title">${esc(s.title)}</p>` : ""}
              ${s.subtitle ? `<p class="v2f-h5m">${esc(s.subtitle)}</p>` : ""}
            </div>
            <div class="v2f-csplit-copy sm" style="margin-top:auto;">${(s.paragraphs || []).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
            ${(s.pills || []).length ? `<div class="v2f-csplit-badges">${s.pills.map((b) => `<span>${esc(b)}</span>`).join("")}</div>` : ""}
          </div>
          <div style="flex:1 1 0;min-width:0;padding-top:80px;">${textQuote(s)}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
