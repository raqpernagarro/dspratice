// Template: core/table-rows-3 — header + three rows, each pairing a title with a
// primary and a secondary column. Source Figma frame 109:5488.
import { esc } from "../components.js";
import { frame, pageHeader } from "../frame.js";

export default {
  name: "core/table-rows-3",
  slide: 63.5,
  figmaNode: "109:5488",
  family: "core", role: "table", shape: "rows", count: 3, theme: "light", chrome: false,
  use: "A header, then up to three rows each with a title and two text columns — a simple comparison or spec table.",
  media: [],
  capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 0, titles: 1, body: 6, stats: 0, icons: 0 },
  description: "core/table-rows-3 — header + three rows (title + primary + secondary columns).",
  schema: {
    caption: "string", title: "string", subtitle: "string",
    rows: "array of up to 3 { title, primary, secondary }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", subtitle: "Subtitle",
    rows: Array.from({ length: 3 }, () => ({
      title: "Title",
      primary: "If there is smaller text that would go here. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      secondary: "If there is smaller text that would go here. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "133" },
  },
  render(s) {
    // Figma 109:5488: three TextBlock rows centred under the header.
    const rows = (s.rows || []).slice(0, 3).map((r = {}) => `
      <div class="r"><p class="k">${esc(r.title ?? "")}</p><p class="a">${esc(r.primary ?? "")}</p><p class="b">${esc(r.secondary ?? "")}</p></div>`).join("");
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle }, { halves: true }) +
      `<div class="v2f-trows reveal">${rows}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
