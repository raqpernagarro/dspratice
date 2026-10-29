// Template: main/logos-01 — a "trusted by" logo wall: heading + subtext on the left,
// a 3-column × 4-row grid of client logos on the right. Logo cells render a supplied
// image when given, else a monochrome wordmark placeholder. Source Figma frame
// (main/logos-01, section 342:43164).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

// Brand name → asset slug (matches the extraction script in assets/client-logos/).
export const logoSlug = (s) => String(s).toLowerCase()
  .replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Per-logo optical height (px, in the 1920×1080 stage) — measured from the Figma
// logo walls so each mark is balanced instead of all capped to one height. Wide
// wordmarks sit small; compact/stacked marks sit tall. Keyed by slug; shared across
// the light walls (logos-01/02/03) plus the dark Middle-East wall (logos-05). A wall
// can pass a `scale` to shrink these uniformly (e.g. the logos-04 category rows).
export const LOGO_H = {
  // light walls (Trusted by / leaders)
  google: 54, adt: 73, sandisk: 30, "lor-al": 33, bmw: 81, "bmw-group": 65,
  lufthansa: 38, verizon: 43, twitter: 68, "ahli-united-bank": 80, intel: 52,
  rms: 83, sony: 30, "erste-group": 71, netroadshow: 27, "bank-of-ireland": 99,
  siemens: 32, wwf: 103, lutron: 27, "sharjah-islamic-bank": 60, unicef: 42,
  "johnson-johnson": 51, "maruti-suzuki": 40,
};

// A logo is a string (brand name), or { name, src?, h? }. When no explicit src is
// given we resolve <dir>/<slug>.png; if that file is missing the <img> removes itself
// (onerror) and the CSS-hidden wordmark placeholder shows instead. `opts` may be a
// string (the asset dir, e.g. the white marks for the dark wall) or { dir, scale }.
// Height priority: explicit l.h → LOGO_H[slug] → CSS fallback. `scale` multiplies it.
export const logoCell = (l, opts = {}) => {
  if (typeof opts === "string") opts = { dir: opts };
  const dir = opts.dir || "assets/client-logos";
  const scale = opts.scale || 1;
  const name = typeof l === "string" ? l : (l && l.name) || "";
  const slug = name ? logoSlug(name) : "";
  const src = (l && l.src) || (slug ? `${dir}/${slug}.png` : "");
  const h = (l && l.h) || LOGO_H[slug];
  const hs = h ? ` style="max-height:${Math.round(h * scale)}px"` : "";
  const ph = `<span class="ph">${esc(name)}</span>`;
  return `<div class="v2f-mn-lc">${src
    ? `<img src="${esc(src)}" alt="${esc(name)}" onerror="this.remove()"${hs}>${ph}`
    : ph}</div>`;
};

const LOGOS = ["Google", "ADT", "SanDisk", "L’Oréal", "BMW", "Lufthansa",
  "Verizon", "Twitter", "ahli united bank", "Intel", "RMS", "SONY"];

export default {
  name: "main/logos-01", slide: -47, figmaNode: "342:37760",
  family: "main", role: "logos", shape: "split", theme: "light", chrome: false,
  use: "A 'trusted by' client logo wall — heading left, 3×4 logo grid right.",
  media: ["logo"], capacity: { items: 12, min: 6, max: 12 },
  slots: { images: 12, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "main/logos-01 — heading + subtext left, 3×4 logo wall right.",
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
        <div class="v2f-mn-logos1 reveal">
          <div class="v2f-mn-logos1-head">
            <p class="v2f-mn-h" style="white-space:pre-line;">${esc(s.title ?? "")}</p>
            ${s.subtitle ? `<p class="sub">${esc(s.subtitle)}</p>` : ""}
          </div>
          <div class="v2f-mn-logos1-wall">${wall}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
