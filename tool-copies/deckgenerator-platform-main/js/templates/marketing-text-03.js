// Template: marketing/text-03 — a small page header at the top and one centered 100px statement with a muted eyebrow above it.
// Source Figma frame 110:30501.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkTocTile, mkTocRow, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-03", slide: 313, figmaNode: "110:30501",
  family: "marketing", role: "statement", shape: "single", theme: "light", chrome: false,
  use: "A page header, then a large centered statement with an eyebrow",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 2, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "marketing/text-03 — a small page header at the top and one centered 100px statement with a muted eyebrow above it.",
  intent: {
    bestFor: ["stating the problem, the brief or the single idea of a chapter"],
    holds: "a page eyebrow and subtitle, a one-word eyebrow and a statement of up to about 60 characters",
    itemChars: 60,
    avoid: ["long statements", "anything with a list"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", subtitle: "string", label: "string — eyebrow above the statement", title: "string — the statement",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Context", subtitle: "Subtitle", label: "Brief", title: "Clearly state the problem\nyou aim to solve",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "06" },
    footer: MK_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkHead({ caption: s.caption, subtitle: s.subtitle }, { sub: "h4" }).replace("v2f-cs-muted", "v2f-mk-sub60")}
        <div class="v2f-mk-center reveal">
          ${s.label ? `<p class="v2f-cs-h4 v2f-cs-muted">${esc(s.label)}</p>` : ""}
          <p class="v2f-cs-h1 v2f-mk-c">${esc(s.title ?? "")}</p>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
