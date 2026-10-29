// Template: portfolio/grid-17 — a project header, a row of tall "story" photos,
// and a Year / Category / Link meta row. Source Figma frame 109:10636.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { SAMPLE, tile } from "../blocks.js";

const metaRow = (items = []) =>
  `<div class="v2f-pf-meta">${items.map((m) => `<div class="m"><p class="l">${esc(m.label ?? "")}</p><p class="v">${esc(m.value ?? "")}</p></div>`).join("")}</div>`;

export default {
  name: "portfolio/grid-17",
  slide: 105,
  figmaNode: "109:10636",
  family: "portfolio", role: "stories", shape: "row", count: 6, theme: "light", chrome: false,
  use: "A project header, a row of tall story-format photos, and a meta row.",
  media: ["photo"],
  capacity: { items: 6, min: 3, max: 6 },
  slots: { images: 6, titles: 1, subtitles: 1, body: 0, stats: 3, icons: 0 },
  description: "portfolio/grid-17 — project header + row of tall story photos + meta.",
  schema: {
    title: "string", client: "string", images: "array of up to 6 photo paths",
    meta_items: "array of { label, value }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Project name", client: "Client",
    images: SAMPLE.slice(0, 6),
    meta_items: [{ label: "Year", value: "2025" }, { label: "Category", value: "Graphic Design" }, { label: "Link", value: "" }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "200" },
  },
  render(s) {
    const stories = (s.images || []).slice(0, 6).map(tile).join("");
    const middle = `
      <div class="v2f-pf-phead" style="flex:0 0 auto">
        ${s.title ? `<p class="t">${esc(s.title)}</p>` : ""}
        ${s.client ? `<p class="cl">${esc(s.client)}</p>` : ""}
      </div>
      <div class="v2f-pf-stories reveal">${stories}</div>
      ${metaRow(s.meta_items || [])}`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
