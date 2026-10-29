// Template: portfolio/grid-23 — a "More Work" heading above a table of projects
// (Project / Client / Service / Comments / Link). Source Figma frame 109:10751.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/grid-23",
  slide: 114,
  figmaNode: "109:10751",
  family: "portfolio", role: "table", shape: "rows", theme: "light", chrome: false,
  use: "A heading above a table of projects (Project / Client / Service / Comments / Link).",
  media: [],
  capacity: { items: 8, min: 1, max: 10 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/grid-23 — More Work heading + 5-column project table.",
  schema: {
    title: "string",
    columns: "array of column headers (default Project/Client/Service/Comments/Link)",
    rows: "array of { project, client, service, comments, link }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "More Work",
    rows: Array.from({ length: 8 }, () => ({
      project: "Lorem ipsum", client: "Lorem ipsum", service: "Lorem ipsum",
      comments: "Lorem ipsum", link: "Link",
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "209" },
  },
  render(s) {
    const head = `<div class="hd"><span class="c">Project</span><span class="c">Client</span><span class="c">Service</span><span class="c">Comments</span><span class="c lk">Link</span></div>`;
    const rows = (s.rows || [])
      .map((r) => `<div class="r"><span class="c">${esc(r.project ?? "")}</span><span class="c">${esc(r.client ?? "")}</span><span class="c">${esc(r.service ?? "")}</span><span class="c">${esc(r.comments ?? "")}</span><span class="c lk">${esc(r.link ?? "Link")}</span></div>`)
      .join("");
    const middle = `
      <p class="v2f-pf-sechead lg">${esc(s.title ?? "More Work")}</p>
      <div class="v2f-pf-table5 reveal">${head}${rows}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
