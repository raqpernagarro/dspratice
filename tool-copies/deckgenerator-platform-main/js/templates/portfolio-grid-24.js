// Template: portfolio/grid-24 — a "Let's work together" closing: big heading + a
// photo, phone / web, and a table of social handles. Source Figma frame
// 109:10864.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/grid-24",
  slide: 115,
  figmaNode: "109:10864",
  family: "portfolio", role: "contact", shape: "single", theme: "light", chrome: false,
  use: "A closing contact slide: big heading + a photo, phone / web, and a table of social handles.",
  media: ["photo"],
  capacity: { items: 4, min: 1, max: 6 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 0, stats: 4, icons: 0 },
  description: "portfolio/grid-24 — Let's work together heading + photo + contact rows.",
  schema: {
    title: "string", image: "string — photo path", phone: "string", web: "string",
    socials: "array of { label, handle }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Let’s work together",
    image: "assets/photography/20200717-091246_Nagarro_424.jpg",
    phone: "+ 123 456 7890", web: "www.nagarro.com",
    socials: [
      { label: "Instagram", handle: "@themasterslides" },
      { label: "Twitter", handle: "@themasterslides" },
      { label: "Are.na", handle: "@themasterslides" },
      { label: "Pinterest", handle: "@themasterslides" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "210" },
  },
  render(s) {
    const rows = (s.socials || [])
      .map((c) => `<div class="v2f-pf-contactrow"><span class="l">${esc(c.label ?? "")}</span><span class="h">${esc(c.handle ?? "")}</span></div>`)
      .join("");
    const middle = `
      <div style="display:flex;gap:40px;flex:1 1 0;min-height:0;align-items:flex-start">
        <p class="v2f-pf-lead" style="flex:1 1 0;font-size:60px;line-height:68px">${esc(s.title ?? "")}</p>
        <div class="v2f-imgbox" style="flex:0 0 442px;aspect-ratio:442/431;align-self:flex-start">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
      </div>
      <div style="display:flex;gap:40px;flex:0 0 auto;align-items:flex-end">
        <div style="flex:1 1 0;display:flex;flex-direction:column;font-family:var(--font-display,'Equip Extended',sans-serif);font-weight:500;font-size:36px;line-height:44px;letter-spacing:-.72px;color:var(--fg-100,#010716)">
          ${s.phone ? `<span>${esc(s.phone)}</span>` : ""}
          ${s.web ? `<span>${esc(s.web)}</span>` : ""}
        </div>
        <div class="v2f-pf-contact" style="flex:0 0 908px">${rows}</div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
