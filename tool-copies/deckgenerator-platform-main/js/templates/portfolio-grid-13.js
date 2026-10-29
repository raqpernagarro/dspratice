// Template: portfolio/grid-13 — a narrow project detail (title / client + body)
// on the left, three large photos cascading diagonally down-right on the right.
// Source Figma frame 109:10493.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { tile, SAMPLE } from "../blocks.js";

export default {
  name: "portfolio/grid-13",
  slide: 96,
  figmaNode: "109:10493",
  family: "portfolio", role: "text", shape: "split", theme: "light", chrome: false,
  use: "A narrow project detail on the left, a collage of photos filling the right.",
  media: ["photo"],
  capacity: { items: 3, min: 1, max: 3 },
  slots: { images: 3, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "portfolio/grid-13 — narrow project detail left, diagonal photo cascade right.",
  schema: {
    title: "string", client: "string", body: "string",
    images: "array of up to 3 photo paths (stacked front-to-back)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Project name", client: "Client",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: [SAMPLE[1], SAMPLE[7], SAMPLE[11]],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "191" },
  },
  render(s) {
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c" style="flex:0 0 442px">
          <div class="v2f-pf-phead">
            ${s.title ? `<p class="t">${esc(s.title)}</p>` : ""}
            ${s.client ? `<p class="cl">${esc(s.client)}</p>` : ""}
          </div>
          <div class="v2f-pf-blk">${s.body ? `<p>${esc(s.body)}</p>` : ""}</div>
        </div>
        <div class="v2f-pf-cascade">${(s.images || []).slice(0, 3).map(tile).join("")}</div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
