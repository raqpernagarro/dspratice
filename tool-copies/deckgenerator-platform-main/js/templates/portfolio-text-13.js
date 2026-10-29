// Template: portfolio/text-13 — a project header (title / client / year + two
// body columns) above a row of photos. Source Figma frame 109:10593.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { photoGrid, SAMPLE } from "../blocks.js";

export default {
  name: "portfolio/text-13",
  slide: 103,
  figmaNode: "109:10593",
  family: "portfolio", role: "text", shape: "single", theme: "light", chrome: false,
  use: "A project header (title / client / year + body columns) above a row of photos.",
  media: ["photo"],
  capacity: { items: 3, min: 1, max: 3 },
  slots: { images: 3, titles: 1, subtitles: 1, body: 2, stats: 0, icons: 0 },
  description: "portfolio/text-13 — project header + body columns + photo row.",
  schema: {
    title: "string", client: "string", year: "string",
    body: "array of up to 2 paragraphs", images: "array of up to 3 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Project name", client: "Client", year: "2023",
    body: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    ],
    images: SAMPLE.slice(9, 12),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "198" },
  },
  render(s) {
    const yearStyle = "margin:0;flex:0 0 auto;font-family:var(--font-display,'Equip Extended',sans-serif);font-weight:500;font-size:36px;line-height:44px;letter-spacing:-0.02em;color:var(--fg-25,rgba(1,7,22,.25))";
    const middle = `
      <div style="display:flex;gap:40px;flex:0 0 auto;align-items:flex-start;padding-top:8px">
        <div class="v2f-pf-phead" style="flex:0 0 360px">
          ${s.title ? `<p class="t">${esc(s.title)}</p>` : ""}
          ${s.client ? `<p class="cl">${esc(s.client)}</p>` : ""}
        </div>
        ${s.year ? `<p style="${yearStyle}">${esc(s.year)}</p>` : ""}
        <div class="v2f-pf-bodycols" style="flex:1 1 0">${(s.body || []).slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      </div>
      ${photoGrid((s.images || []).slice(0, 3), 3)}`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
