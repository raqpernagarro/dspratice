// Template: core/cover-single — the deck cover: top bar, big Heading1 title +
// Heading2 subtitle, a Company/Date/Project block, then the footer. Light theme.
// Source Figma frame 109:4893. Uses the shared v2 frame (js/frame.js + .v2f-* CSS).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "core/cover-single",
  slide: 1,
  figmaNode: "109:4893",
  family: "core",
  role: "cover",
  shape: "single",
  theme: "light",
  chrome: false,
  use: "The opening cover of a deck: presentation title and subtitle, with company / date / project details.",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "core/cover-single — cover with large title + subtitle and a company/date/project block.",
  schema: {
    title: "string — 100px presentation title",
    subtitle: "string — 60px subtitle",
    company: "string", date: "string", project: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Presentation Title", subtitle: "Subtitle here",
    company: "Company", date: "Date", project: "Project",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "80" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-cover">
        <div class="v2f-cover-row reveal">
          ${topBar(s.meta)}
          <div class="v2f-cover-head">
            ${s.title ? `<p class="v2f-cover-title">${esc(s.title)}</p>` : ""}
            ${s.subtitle ? `<p class="v2f-cover-sub">${esc(s.subtitle)}</p>` : ""}
          </div>
        </div>
        <div class="v2f-cover-meta reveal">
          ${s.company ? `<p>${esc(s.company)}</p>` : ""}
          ${s.date ? `<p>${esc(s.date)}</p>` : ""}
          ${s.project ? `<p>${esc(s.project)}</p>` : ""}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
