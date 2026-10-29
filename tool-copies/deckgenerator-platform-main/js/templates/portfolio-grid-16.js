// Template: portfolio/grid-16 — a project name / client + body on a narrow left
// column, a 3-column grid of photos on the right. Source Figma frame 109:10614.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { staggerWall, SAMPLE } from "../blocks.js";

export default {
  name: "portfolio/grid-16",
  slide: 104,
  figmaNode: "109:10614",
  family: "portfolio", role: "text", shape: "split", theme: "light", chrome: false,
  use: "A project name / client + body on a narrow left column, a 3-column grid of photos on the right.",
  media: ["photo"],
  capacity: { items: 9, min: 3, max: 9 },
  slots: { images: 9, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "portfolio/grid-16 — project header + body left, 3-col photo grid right.",
  schema: {
    title: "string", client: "string", body: "string", images: "array of photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Project name", client: "Client",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: [...SAMPLE, ...SAMPLE].slice(2, 11),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "199" },
  },
  render(s) {
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c between" style="flex:0 0 560px">
          <div class="v2f-pf-phead">
            ${s.title ? `<p class="t">${esc(s.title)}</p>` : ""}
            ${s.client ? `<p class="cl">${esc(s.client)}</p>` : ""}
          </div>
          <div class="v2f-pf-blk">${s.body ? `<p>${esc(s.body)}</p>` : ""}</div>
        </div>
        <div class="c">${staggerWall((s.images || []).slice(0, 9), { cols: 3, aspect: "385 / 372", offsets: [50, -90, 50] })}</div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
