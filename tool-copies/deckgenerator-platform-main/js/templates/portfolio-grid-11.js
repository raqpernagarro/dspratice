// Template: portfolio/grid-11 — a project detail: title + client + a Year /
// Category / Link meta row on the left, two columns of body copy on the right.
// Source Figma frame 109:10340.
import { esc } from "../components.js";
import { frame } from "../frame.js";

const metaRow = (items = []) =>
  `<div class="v2f-pf-meta">${items.map((m) => `<div class="m"><p class="l">${esc(m.label ?? "")}</p><p class="v">${esc(m.value ?? "")}</p></div>`).join("")}</div>`;

export default {
  name: "portfolio/grid-11",
  slide: 85,
  figmaNode: "109:10340",
  family: "portfolio", role: "detail", shape: "split", theme: "light", chrome: false,
  use: "A project detail: title + client + meta on the left, two columns of body copy on the right.",
  media: [],
  capacity: { items: 2, min: 1, max: 2 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 2, stats: 3, icons: 0 },
  description: "portfolio/grid-11 — project title/client/meta + two body columns.",
  schema: {
    title: "string", client: "string", meta_items: "array of { label, value }",
    body: "array of up to 2 paragraphs",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Project name", client: "Client",
    meta_items: [
      { label: "Year", value: "2025" },
      { label: "Category", value: "Graphic Design" },
      { label: "Link", value: "" },
    ],
    body: [
      "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas.",
      "Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.",
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "180" },
  },
  render(s) {
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c">
          <div class="v2f-pf-phead">
            ${s.title ? `<p class="t">${esc(s.title)}</p>` : ""}
            ${s.client ? `<p class="cl">${esc(s.client)}</p>` : ""}
          </div>
          ${metaRow(s.meta_items || [])}
        </div>
        <div class="c">
          <div class="v2f-pf-bodycols">${(s.body || []).slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
        </div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
