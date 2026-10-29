// Template: core/quote-split-photo — a photo on the left beside a large quotation
// on the right. Source Figma frame 109:5527.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { textQuote, quoteWho } from "../blocks.js";

export default {
  name: "core/quote-split-photo",
  slide: 62,
  figmaNode: "109:5527",
  family: "core", role: "quote", shape: "split", theme: "light", chrome: false,
  use: "A supporting photo on the left beside a large quotation on the right.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 0, body: 1, stats: 0, icons: 0 },
  description: "core/quote-split-photo — left photo + right large quotation.",
  schema: {
    quote: "string — the quotation; wrap key phrases in **double asterisks** to highlight them",
    attribution: "string — source line under the quote",
    name: "string", title: "string — the person's role", company: "string",
    image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    quote: "Full page quote or sentence. Lorem ipsum dolor sit amet, consectetur adipiscing elit. **Lorem ipsum dolor sit amet, consectetur adipiscing elit.** Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod **tempor incididunt** ut labore et dolore magna aliqua.",
    attribution: "Lorem ipsum",
    name: "Name", title: "Title", company: "Company",
    image: "assets/photography/20200717-085451_Nagarro_4227.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "136" },
  },
  render(s) {
    // Figma 109:5527: a 544px photo, then a column with the top bar, the quote
    // (highlighted phrases in full colour) and the name block at the bottom.
    const hl = /\*\*.+?\*\*/.test(s.quote ?? "");
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal" style="gap:40px;">
          <div class="v2f-csplit-photos" style="flex:0 0 544px;"><div class="ph">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div></div>
          <div class="v2f-csplit-text" style="flex:1 1 0;min-width:0;">
            ${topBar(s.meta)}
            ${textQuote(s).replace('class="v2f-tq"', `class="v2f-tq${hl ? " hl" : ""}" style="gap:16px"`)}
            ${quoteWho(s)}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
