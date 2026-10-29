// Template: core/quote-fullbleed — a full-page statement set at Heading1 scale,
// with a Name / Title / Company attribution block. Source Figma frame 109:5536.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { quoteWho } from "../blocks.js";

export default {
  name: "core/quote-fullbleed",
  slide: 61,
  figmaNode: "109:5536",
  family: "core", role: "quote", shape: "fullbleed", theme: "light", chrome: false,
  use: "A full-page quotation set large (Heading1 scale), attributed to a person — name, title and company.",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 0, body: 1, stats: 0, icons: 0 },
  description: "core/quote-fullbleed — a large full-page quote with a Name / Title / Company attribution.",
  schema: {
    quote: "string — the quotation (rendered at 100px, in quote marks)",
    name: "string", title: "string", company: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    quote: "Full page quote or sentence. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    name: "Name", title: "Title", company: "Company",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "139" },
  },
  render(s) {
    const middle =
      `<p class="v2f-quote-xl reveal">“${esc(s.quote ?? "")}”</p>` +
      `<div class="reveal" style="flex:1 1 0;min-height:0;display:flex;flex-direction:column;">${quoteWho(s)}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
