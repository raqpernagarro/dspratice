// Template: pitch/cover — the pitch's opening: a very large title with a muted subtitle,
// and the company and date pinned to the bottom-left.
// Source Figma frame 110:36991.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptTocItem, ptMetricCard, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/cover", slide: 262, figmaNode: "110:36991",
  family: "pitch", role: "cover", shape: "single", theme: "light", chrome: false,
  use: "The cover: a very large title with a subtitle, the company and the date at the bottom.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "pitch/cover — very large title + subtitle, company and date at the bottom.",
  intent: {
    bestFor: ["the first slide of a pitch deck"],
    holds: "a title of one to three words and a short subtitle; the company and the date",
    itemChars: 24,
    avoid: ["any slide but the first", "long titles (the title is 150px tall)"],
    feel: "statement",
    needs: [],
  },
  schema: {
    title: "string — up to about 3 words", subtitle: "string", company: "string — e.g. © Company", date: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Pitch", subtitle: "Template", company: "© Company", date: "Date",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "02" },
    footer: PT_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-pt-cover reveal">
          <div class="mid">
            ${s.title ? `<p class="t">${esc(s.title)}</p>` : ""}
            ${s.subtitle ? `<p class="s">${esc(s.subtitle)}</p>` : ""}
          </div>
          <div class="v2f-cs-lines lg">${s.company ? `<p>${esc(s.company)}</p>` : ""}${s.date ? `<p>${esc(s.date)}</p>` : ""}</div>
        </div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
