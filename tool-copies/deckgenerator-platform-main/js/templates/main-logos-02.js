// Template: main/logos-02 — a denser "trusted by" logo wall: heading + subtext on the
// left, a 3-column × 7-row grid of client logos on the right. Source Figma frame
// 431:30269 (main/logos-02, section 342:43164).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { logoCell } from "./main-logos-01.js";

const LOGOS = ["Google", "ERSTE Group", "SanDisk", "L’Oréal", "BMW GROUP", "Lufthansa",
  "Verizon", "Twitter", "ahli united bank", "Intel", "NetRoadshow", "SONY",
  "Bank of Ireland", "RMS", "SIEMENS", "WWF", "LUTRON", "Sharjah Islamic Bank",
  "unicef", "Johnson & Johnson", "MARUTI SUZUKI"];

export default {
  name: "main/logos-02", slide: -46, figmaNode: "431:30269",
  family: "main", role: "logos", shape: "split", theme: "light", chrome: false,
  use: "A dense 'trusted by' client logo wall — heading left, 3×7 logo grid right.",
  media: ["logo"], capacity: { items: 21, min: 9, max: 24 },
  slots: { images: 21, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "main/logos-02 — heading + subtext left, 3×7 logo wall right.",
  schema: {
    title: "string", subtitle: "string",
    logos: "array of string | { name, src }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Trusted by\nglobal brands",
    subtitle: "We help our clients transform innovative ideas into inspiring brands, amazing products and cutting edge experiences that touch millions.",
    logos: LOGOS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const wall = (s.logos || LOGOS).map((l) => logoCell(l)).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-logos2 reveal">
          <div class="v2f-mn-logos2-head">
            <p class="v2f-mn-h" style="white-space:pre-line;">${esc(s.title ?? "")}</p>
            ${s.subtitle ? `<p class="sub">${esc(s.subtitle)}</p>` : ""}
          </div>
          <div class="v2f-mn-logos2-wall">${wall}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
