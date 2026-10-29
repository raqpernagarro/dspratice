// Template: portfolio/text-03 — the portfolio's chapter cover: one oversized
// muted word (e.g. "Index", a project name) vertically centred. Source Figma
// frame 109:10232. Figma had three more copies of this layout (text-04, text-09,
// text-12); they were removed so the layout chooser sees one chapter cover.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "portfolio/text-03",
  slide: 77,
  figmaNode: "109:10232",
  family: "portfolio", role: "divider", shape: "single", theme: "light", chrome: false,
  use: "A chapter cover: one oversized muted word, vertically centered.",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/text-03 — chapter cover, one oversized muted word.",
  intent: {
    bestFor: ["opening a chapter of a portfolio: the index, a project, a section"],
    holds: "one word or a very short name, up to about 12 characters",
    itemChars: 14,
    avoid: ["sentences or a title with several words", "anything that is not a chapter break"],
    feel: "statement",
    needs: [],
  },
  schema: {
    word: "string — the divider term",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    word: "Index",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "172" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-pf-bigword reveal"><p>${esc(s.word ?? "")}</p></div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
