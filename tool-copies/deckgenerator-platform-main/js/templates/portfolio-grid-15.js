// Template: portfolio/grid-15 — a project case study: header (title / client /
// year + meta) with intro copy on top, then a photo beside "Approach" and
// "Outcomes" write-ups. Source Figma frame 109:10568.
import { esc } from "../components.js";
import { frame } from "../frame.js";

const metaRow = (items = []) =>
  `<div class="v2f-pf-meta">${items.map((m) => `<div class="m"><p class="l">${esc(m.label ?? "")}</p><p class="v">${esc(m.value ?? "")}</p></div>`).join("")}</div>`;
const blk = (b = {}) => `<div class="v2f-pf-blk">${b.title ? `<p class="h">${esc(b.title)}</p>` : ""}${b.body ? `<p>${esc(b.body)}</p>` : ""}</div>`;

export default {
  name: "portfolio/grid-15",
  slide: 102,
  figmaNode: "109:10568",
  family: "portfolio", role: "casestudy", shape: "split", theme: "light", chrome: false,
  use: "A project case study: header + intro on top, then a photo beside Approach / Outcomes write-ups.",
  media: ["photo"],
  capacity: { items: 2, min: 1, max: 2 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 3, stats: 3, icons: 0 },
  description: "portfolio/grid-15 — project header + intro + photo + Approach/Outcomes.",
  schema: {
    title: "string", client: "string", year: "string", meta_items: "array of { label, value }",
    intro: "array of up to 2 paragraphs", image: "string — photo path",
    approach: "{ title, body }", outcomes: "{ title, body }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Project name", client: "Client", year: "2023",
    meta_items: [{ label: "Year", value: "2025" }, { label: "Category", value: "Graphic Design" }, { label: "Link", value: "" }],
    intro: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    ],
    image: "assets/photography/20200717-084726_Nagarro_295.jpg",
    approach: { title: "Approach", body: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis." },
    outcomes: { title: "Outcomes", body: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis." },
    meta: { studio: "Product Studio", name: "Presentation Name", page: "197" },
  },
  render(s) {
    const yearStyle = "margin:0;font-family:var(--font-display,'Equip Extended',sans-serif);font-weight:500;font-size:36px;line-height:44px;letter-spacing:-0.02em;color:var(--fg-25,rgba(1,7,22,.25))";
    const middle = `
      <div style="display:flex;gap:40px;flex:0 0 auto;align-items:flex-start;padding-top:8px">
        <div style="flex:0 0 360px;display:flex;flex-direction:column;gap:16px">
          <div class="v2f-pf-phead">
            ${s.title ? `<p class="t">${esc(s.title)}</p>` : ""}
            ${s.client ? `<p class="cl">${esc(s.client)}</p>` : ""}
          </div>
          ${s.year ? `<p style="${yearStyle}">${esc(s.year)}</p>` : ""}
          ${metaRow(s.meta_items || [])}
        </div>
        <div class="v2f-pf-bodycols" style="flex:1 1 0">${(s.intro || []).slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      </div>
      <div class="v2f-pf-cols" style="padding-top:0">
        <div class="photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
        <div class="c">${blk(s.approach || {})}</div>
        <div class="c">${blk(s.outcomes || {})}</div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
