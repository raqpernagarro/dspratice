// Template: portfolio/grid-14 — a project "Brief": a heading + paragraph at the
// top, and a Year / Category / Link meta row pinned to the bottom. Source Figma
// frame 109:10553.
import { esc } from "../components.js";
import { frame } from "../frame.js";

const metaRow = (items = []) =>
  `<div class="v2f-pf-meta">${items.map((m) => `<div class="m"><p class="l">${esc(m.label ?? "")}</p><p class="v">${esc(m.value ?? "")}</p></div>`).join("")}</div>`;

export default {
  name: "portfolio/grid-14",
  slide: 101,
  figmaNode: "109:10553",
  // The same layout as portfolio/grid-09. Kept registered so the saved decks
  // that use it still render; never offered for new slides.
  replacedBy: "portfolio/grid-09",
  family: "portfolio", role: "brief", shape: "single", theme: "light", chrome: false,
  use: "A project brief: a heading + paragraph at the top, a Year / Category / Link meta row at the bottom.",
  media: [],
  capacity: { items: 3, min: 1, max: 4 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 1, stats: 3, icons: 0 },
  description: "portfolio/grid-14 — brief heading + paragraph + bottom meta row.",
  schema: {
    title: "string", body: "string", meta_items: "array of { label, value }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Brief",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    meta_items: [
      { label: "Year", value: "2025" },
      { label: "Category", value: "Graphic Design" },
      { label: "Link", value: "" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "196" },
  },
  render(s) {
    const middle = `
      <div class="v2f-pf-brief reveal">
        <div class="top">
          ${s.title ? `<p class="h">${esc(s.title)}</p>` : ""}
          ${s.body ? `<p>${esc(s.body)}</p>` : ""}
        </div>
        ${metaRow(s.meta_items || [])}
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
