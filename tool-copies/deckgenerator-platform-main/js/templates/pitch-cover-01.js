// Template: pitch/cover-01 — a section divider: one large numbered section header.
// Source Figma frame 110:37015.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptTocItem, ptMetricCard, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/cover-01", slide: 265, figmaNode: "110:37015",
  family: "pitch", role: "divider", shape: "single", theme: "light", chrome: false,
  use: "A section divider: a large number and the section's name.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "pitch/cover-01 — one large numbered section header.",
  intent: {
    bestFor: ["opening a section of a pitch deck: the number and its name"],
    holds: "a two-digit number and a section name of up to about 40 characters",
    itemChars: 40,
    avoid: ["any content", "more than one line of text"],
    feel: "statement",
    needs: [],
  },
  schema: {
    number: "string — e.g. 01", label: "string — the section name",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    number: "01", label: "Section header",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "05" },
    footer: PT_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal" style="flex:1 1 0;min-height:0;">${ptTocItem({ number: s.number, label: s.label }, 0)}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
