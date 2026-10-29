// Template: finance/cover — the financial-report cover: bold Heading1 title +
// muted Heading2 subtitle, with a small company/date sign-off block. Light theme.
// Source Figma frame 110:18191 (Finance category).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "finance/cover",
  slide: 117,
  figmaNode: "110:18191",
  family: "finance",
  role: "cover",
  shape: "single",
  theme: "light",
  chrome: false,
  use: "The opening cover of a financial report: a bold report title + muted subtitle, with a company / date sign-off.",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "finance/cover — bold report title + muted subtitle and a company/date block.",
  schema: {
    title: "string — 100px bold report title",
    subtitle: "string — 60px muted subtitle",
    company: "string", date: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Financial report", subtitle: "Template",
    company: "© Company", date: "Date",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "284" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-cover">
        <div class="v2f-cover-row reveal">
          ${topBar(s.meta)}
          <div class="v2f-cover-head v2f-fin-cover-center">
            ${s.title ? `<p class="v2f-fin-cover-title">${esc(s.title)}</p>` : ""}
            ${s.subtitle ? `<p class="v2f-fin-cover-sub">${esc(s.subtitle)}</p>` : ""}
          </div>
        </div>
        <div class="v2f-cover-meta reveal">
          ${s.company ? `<p>${esc(s.company)}</p>` : ""}
          ${s.date ? `<p>${esc(s.date)}</p>` : ""}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
