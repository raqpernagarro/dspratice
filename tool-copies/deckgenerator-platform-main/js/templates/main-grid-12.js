// Template: main/grid-12 — a bold heading with a two-paragraph intro, over a row of
// three icon features (illustrative mint glyph + title + description).
// Source Figma frame 342:40295.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const GLYPHS = {
  // four overlapping circles (N/S/E/W) forming a symmetric flower
  brand: `<svg viewBox="0 0 96 96" fill="none"><circle cx="48" cy="30" r="28" fill="rgba(71,215,172,.16)"/><circle cx="48" cy="66" r="28" fill="rgba(71,215,172,.16)"/><circle cx="30" cy="48" r="28" fill="rgba(71,215,172,.16)"/><circle cx="66" cy="48" r="28" fill="rgba(71,215,172,.16)"/></svg>`,
  // three rounded screens staggered diagonally, growing toward the front
  device: `<svg viewBox="0 0 96 96" fill="none"><rect x="8" y="6" width="36" height="36" rx="8" fill="rgba(71,215,172,.14)"/><rect x="20" y="20" width="44" height="40" rx="8" fill="rgba(71,215,172,.18)"/><rect x="34" y="34" width="52" height="42" rx="8" fill="rgba(71,215,172,.14)"/></svg>`,
  // six-tile bento grid
  store: `<svg viewBox="0 0 96 96" fill="none"><g fill="rgba(71,215,172,.16)"><rect x="4" y="6" width="28" height="24" rx="5"/><rect x="38" y="6" width="54" height="24" rx="5"/><rect x="4" y="36" width="28" height="24" rx="5"/><rect x="38" y="36" width="24" height="24" rx="5"/><rect x="68" y="36" width="24" height="54" rx="5"/><rect x="4" y="66" width="58" height="24" rx="5"/></g></svg>`,
};

const FEATURES = [
  { glyph: "brand", t: "Multi-brand", d: "Supports multiple brands on the same platform while allowing each to maintain its own visual identity." },
  { glyph: "device", t: "Multi-device", d: "Ensures consistent experiences across web, mobile, and native platforms through share components and responsive patterns." },
  { glyph: "store", t: "Multi-store", d: "Enables brands to operate multiple store experiences from a single design foundation with configurable store-level varitions." },
];

export default {
  name: "main/grid-12", slide: -18, figmaNode: "342:40295",
  family: "main", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A bold heading + two-paragraph intro over a row of three icon features (mint glyph + title + description).",
  media: [], capacity: { items: 3, min: 3, max: 4 },
  slots: { images: 0, titles: 1, body: 2, stats: 0, icons: 3 },
  description: "main/grid-12 — bold heading + intro, then 3 icon features.",
  schema: {
    title: "string — bold heading", body: "array of intro paragraph strings",
    features: "array of { glyph:'brand'|'device'|'store', t, d }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "The Design System as a Business Asset",
    body: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus et  malesuada fames ac turpis egestas. Nulla at risus.",
      "Quisque purus magna,  auctor et, sagittis ac, posuere eu, lectus. Nam mattis, felis ut  adipiscing.Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et  malesuada fames ac turpis egestas.",
    ],
    features: FEATURES,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    const features = s.features || FEATURES;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-g12 reveal">
          <div class="top">
            ${s.title ? `<p class="ttl">${esc(s.title)}</p>` : ""}
            <div class="v2f-mn-prose airy">${body}</div>
          </div>
          <div class="feats">
            ${features.map((f) => `<div class="ft">
              <span class="gl">${GLYPHS[f.glyph] || ""}</span>
              <p class="t">${esc(f.t)}</p>
              <p class="d">${esc(f.d)}</p>
            </div>`).join("")}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
