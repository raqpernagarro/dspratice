// Template: pitch/index — a full-width table of contents: up to six large numbered sections.
// Source Figma frame 110:37007.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptTocItem, ptMetricCard, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/index", slide: 264, figmaNode: "110:37007",
  family: "pitch", role: "index", shape: "list", theme: "light", chrome: false,
  use: "A full-width list of up to six large numbered sections.",
  media: [], capacity: { items: 6, min: 3, max: 6 },
  slots: { images: 0, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0, list: 6 },
  description: "pitch/index — full-width numbered table of contents.",
  intent: {
    bestFor: ["the agenda of a pitch deck when the outline is the whole slide"],
    holds: "3–6 section names of up to about 40 characters",
    itemChars: 40,
    avoid: ["more than six sections", "sections that need a sentence each (use pitch/grid-01)"],
    feel: "airy",
    needs: [],
  },
  schema: {
    items: "array of up to 6 { number, label }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    items: ["Introduce the problem", "Present your solution", "Highlight your product", "Business", "Target your market", "Outline the next steps"].map((label, i) => ({ number: String(i + 1).padStart(2, "0"), label })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "04" },
    footer: PT_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-pt-toclist reveal" style="gap:32px;">${(s.items || []).slice(0, 6).map(ptTocItem).join("")}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
