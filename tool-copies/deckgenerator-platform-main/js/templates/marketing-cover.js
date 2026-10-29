// Template: marketing/cover — the opening slide: a very large title with a muted subtitle and the company and date.
// Source Figma frame 110:30458.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkTocTile, mkTocRow, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/cover", slide: 308, figmaNode: "110:30458",
  family: "marketing", role: "cover", shape: "single", theme: "light", chrome: false,
  use: "Title + subtitle, centered vertically; company and date at the bottom-left",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "marketing/cover — the opening slide: a very large title with a muted subtitle and the company and date.",
  intent: {
    bestFor: ["the first slide of a marketing or campaign deck"],
    holds: "a title of one to three words, a one-word subtitle, a company line and a date",
    itemChars: 24,
    avoid: ["long titles (the text is 150px)", "anything other than the first slide"],
    feel: "statement",
    needs: [],
  },
  schema: {
    title: "string", subtitle: "string", company: "string", date: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Marketing", subtitle: "Template", company: "© Company", date: "Date",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
    footer: MK_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-cover reveal">
          <div class="mid">
            ${s.title ? `<p class="t">${esc(s.title)}</p>` : ""}
            ${s.subtitle ? `<p class="s">${esc(s.subtitle)}</p>` : ""}
          </div>
          <div class="v2f-cs-lines lg">${s.company ? `<p>${esc(s.company)}</p>` : ""}${s.date ? `<p>${esc(s.date)}</p>` : ""}</div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
