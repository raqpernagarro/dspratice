// Template: pitch/quote — a full-page testimonial: one very large quotation, the speaker
// at the bottom-left.
// Source Figma frame 110:37240.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/quote", slide: 288, figmaNode: "110:37240",
  family: "pitch", role: "quote", shape: "single", theme: "light", chrome: false,
  use: "A full-page testimonial in very large type with the speaker's name, title and company.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "pitch/quote — 100px testimonial + speaker line.",
  intent: {
    bestFor: ["a customer or investor testimonial given the whole slide"],
    holds: "a quotation of up to about 140 characters and one line naming the speaker",
    itemChars: 140,
    avoid: ["long quotations (100px type)", "several quotes", "anything but a testimonial"],
    feel: "statement",
    needs: [],
  },
  schema: {
    quote: "string — the testimonial", attribution: "string — name, title & company",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    quote: "Full page testimonial. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.", attribution: "Name, title & company",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "28" },
    footer: PT_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal" style="flex:1 1 0;min-height:0;display:flex;align-items:center;"><p class="v2f-cs-h1" style="margin:0;">“${esc(s.quote ?? "")}”</p></div>
        ${s.attribution ? `<div class="v2f-cs-lines lg"><p>${esc(s.attribution)}</p></div>` : ""}
        ${ptFooter(s.footer)}
      </div>`;
  },
};
