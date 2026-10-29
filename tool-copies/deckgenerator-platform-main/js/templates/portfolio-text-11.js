// Template: portfolio/text-11 — a 3-column grid of photos on top, a project
// header (title / client + body columns) below. Source Figma frame 109:10474.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { photoGrid, SAMPLE } from "../blocks.js";

export default {
  name: "portfolio/text-11",
  slide: 95,
  figmaNode: "109:10474",
  family: "portfolio", role: "text", shape: "single", theme: "light", chrome: false,
  use: "A grid of photos on top, a project header (title / client + body columns) below.",
  media: ["photo"],
  capacity: { items: 6, min: 2, max: 6 },
  slots: { images: 6, titles: 1, subtitles: 1, body: 2, stats: 0, icons: 0 },
  description: "portfolio/text-11 — photo grid top, project header + body below.",
  schema: {
    images: "array of up to 6 photo paths", title: "string", client: "string",
    body: "array of up to 2 paragraphs",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    images: SAMPLE.slice(6, 12),
    title: "Project name", client: "Client",
    body: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "190" },
  },
  render(s) {
    const middle = `
      ${photoGrid((s.images || []).slice(0, 6), 3, false)}
      <div style="display:flex;gap:40px;flex:0 0 auto;align-items:flex-start;padding-top:8px">
        <div class="v2f-pf-phead" style="flex:0 0 360px">
          ${s.title ? `<p class="t">${esc(s.title)}</p>` : ""}
          ${s.client ? `<p class="cl">${esc(s.client)}</p>` : ""}
        </div>
        <div class="v2f-pf-bodycols" style="flex:1 1 0">${(s.body || []).slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
