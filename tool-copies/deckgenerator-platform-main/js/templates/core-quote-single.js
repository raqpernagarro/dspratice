// Template: core/quote-single — a full-page quotation, muted with the whole
// statement in quotation marks. Source Figma frame 109:5524.
import { frame } from "../frame.js";
import { textQuote } from "../blocks.js";

export default {
  name: "core/quote-single",
  slide: 60,
  figmaNode: "109:5524",
  family: "core", role: "quote", shape: "single", theme: "light", chrome: false,
  use: "A full-page quotation or statement, set large in quotation marks.",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 0, body: 1, stats: 0, icons: 0 },
  description: "core/quote-single — one large full-page quotation.",
  schema: {
    quote: "string — the quotation; wrap key phrases in **double asterisks** to highlight them",
    attribution: "string — source line under the quote",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    quote: "Full page quote or sentence. Lorem ipsum dolor sit amet, consectetur adipiscing elit. **Lorem ipsum dolor sit amet, consectetur adipiscing elit.**\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod **tempor incididunt** ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    attribution: "Lorem ipsum",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "137" },
  },
  render(s) {
    // Figma 109:5524: a 1000px TextQuote at 48/56, highlighted phrases in full colour.
    const hl = /\*\*.+?\*\*/.test(s.quote ?? "");
    return frame(`<div class="reveal" style="flex:1 1 0;min-height:0;">${textQuote(s, { width: 1000 }).replace('class="v2f-tq"', `class="v2f-tq s48${hl ? " hl" : ""}"`)}</div>`, { meta: s.meta, footer: s.footer });
  },
};
