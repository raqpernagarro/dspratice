// Template: main/logos-05 — a dark regional logo wall: an eyebrow + heading on the
// left, a 4-column × 5-row grid of client logos on a petrol-black field. Source Figma
// frame (main/logos-05, section 342:43164).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { logoCell } from "./main-logos-01.js";

const LOGOS = ["United Arab Bank", "RTA", "Salik", "LuLu",
  "BSH", "liv.", "ADIB", "Carrefour",
  "ahli united bank", "FAB", { name: "Emirates NBD", h: 54 }, { name: "Sheikh Zayed Mosque", h: 116 },
  "al hilal bank", "NBK", "JAGUAR", "Jordan Islamic Bank",
  "ADCB", "Land Rover", "Emirates Islamic", "mashreq"];

export default {
  name: "main/logos-05", slide: -43, figmaNode: "342:37762",
  family: "main", role: "logos", shape: "split", theme: "dark", chrome: false,
  use: "A dark regional client logo wall — eyebrow + heading left, 4×5 logo grid right on petrol-black.",
  media: ["logo"], capacity: { items: 20, min: 8, max: 24 },
  slots: { images: 20, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/logos-05 — dark regional logo wall (heading left, 4×5 grid right).",
  schema: {
    eyebrow: "string", title: "string",
    logos: "array of string | { name, src }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    eyebrow: "Trusted by",
    title: "Leading clients we work with in the Middle East region",
    logos: LOGOS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const wall = (s.logos || LOGOS).map((l) => logoCell(l, "assets/client-logos/dark")).join("");
    return `
      <div class="v2f-root v2f-dark">
        ${topBar(s.meta)}
        <div class="v2f-mn-logos5 reveal">
          <div class="v2f-mn-logos5-head">
            ${s.eyebrow ? `<p class="v2f-mn-logos5-eyebrow">${esc(s.eyebrow)}</p>` : ""}
            <p class="v2f-mn-h">${esc(s.title ?? "")}</p>
          </div>
          <div class="v2f-mn-logos5-wall">${wall}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
