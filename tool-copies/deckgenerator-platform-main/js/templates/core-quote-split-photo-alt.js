// Template: core/quote-split-photo-alt — mirror of quote-split-photo: a large
// quotation on the left beside a photo on the right. Source Figma frame 109:5543.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { textQuote, quoteWho } from "../blocks.js";

export default {
  name: "core/quote-split-photo-alt",
  slide: 63,
  figmaNode: "109:5543",
  family: "core", role: "quote", shape: "split", theme: "light", chrome: false,
  use: "Mirror of quote-split-photo — a large quotation on the left beside a supporting photo on the right.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 0, body: 1, stats: 0, icons: 0 },
  description: "core/quote-split-photo-alt — left large quotation + right photo.",
  schema: {
    quote: "string — the quotation; wrap key phrases in **double asterisks** to highlight them",
    attribution: "string — source line under the quote",
    name: "string", title: "string — the person's role", company: "string",
    image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    quote: "Full page quote or sentence. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    attribution: "Lorem ipsum",
    name: "Name", title: "Title", company: "Company",
    image: "assets/photography/20200717-103815_Nagarro_958.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "138" },
  },
  render(s) {
    // Figma 109:5543: an 810px column (top bar, quote, name block), then a photo.
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          <div class="v2f-csplit-text" style="width:810px;">
            ${topBar(s.meta)}
            ${textQuote(s).replace('class="v2f-tq"', 'class="v2f-tq xl" style="gap:16px"')}
            ${quoteWho(s)}
          </div>
          <div class="v2f-csplit-photos"><div class="ph">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div></div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
