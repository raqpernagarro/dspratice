// Template: portfolio/text-06 — a project intro: title / client / year + two
// columns of body copy across the top, a full-width photo below. Source Figma
// frame 109:10360.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/text-06",
  slide: 86,
  figmaNode: "109:10360",
  family: "portfolio", role: "text", shape: "single", theme: "light", chrome: false,
  use: "A project intro: title / client / year + two columns of body copy above a full-width photo.",
  media: ["photo"],
  capacity: { items: 2, min: 1, max: 2 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 2, stats: 0, icons: 0 },
  description: "portfolio/text-06 — title/client/year + body columns + bottom photo.",
  schema: {
    title: "string", client: "string", year: "string",
    body: "array of up to 2 paragraphs", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Project name", client: "Client", year: "2026",
    body: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    ],
    image: "assets/photography/20200717-100418_Nagarro_700.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "181" },
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
      <div class="v2f-imgbox reveal" style="flex:1 1 0;min-height:0">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
