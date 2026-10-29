// Template: core/content-list-3 — header + three "title → paragraph" rows.
// Source Figma frame 109:5481.
import { esc } from "../components.js";
import { frame, pageHeader } from "../frame.js";

export default {
  name: "core/content-list-3",
  slide: 21,
  figmaNode: "109:5481",
  family: "core", role: "content", shape: "list", count: 3, theme: "light", chrome: false,
  use: "A header, then up to three rows each pairing a short title with an explanatory paragraph.",
  media: [],
  capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 0, titles: 1, body: 3, stats: 0, icons: 0 },
  description: "core/content-list-3 — header + three title/paragraph rows.",
  schema: {
    caption: "string", title: "string", subtitle: "string",
    items: "array of up to 3 { title, body }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", subtitle: "Subtitle",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "132" },
    items: Array.from({ length: 3 }, () => ({
      title: "Title",
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    })),
  },
  render(s) {
    // Figma 109:5481: three rows spread over the content area, title in the
    // left half, body in the right.
    const rows = (s.items || []).slice(0, 3).map((it = {}) => `
      <div class="r"><p class="k">${esc(it.title ?? "")}</p><p class="v">${esc(it.body ?? "")}</p></div>`).join("");
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle }, { halves: true }) +
      `<div class="v2f-lrows reveal">${rows}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
