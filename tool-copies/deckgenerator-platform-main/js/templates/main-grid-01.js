// Template: main/grid-01 — the "Our caring values" slide: a centred display heading
// with the mint "caring" script between "Our" and "values", over a row of the seven
// caring-value badges. Source Figma frame (main/grid-01, section 342:43164).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const SCRIBBLE = "assets/caring-script-white.png";

// The seven caring values, each paired with its mint line icon (transparent set).
const VALUES = [
  { label: "Client-centric", icon: "Icon client-centric transparent" },
  { label: "Agile", icon: "Icon agile transparent" },
  { label: "Responsible", icon: "Icon responsible transparent" },
  { label: "Intelligent", icon: "Icon intelligent transparent" },
  { label: "Non-hierarchical", icon: "Icon non-hierarchical transparent" },
  { label: "Global", icon: "Icon global transparent" },
  { label: "Caring", icon: "Icon caring transparent" },
];

export default {
  name: "main/grid-01", slide: -53, figmaNode: "342:37540",
  family: "main", role: "content", shape: "grid", theme: "dark", chrome: false,
  use: "The seven Nagarro caring values as mint line icons under a scripted 'Our caring values' heading, on petrol black.",
  media: ["icon"], capacity: { items: 7, min: 7, max: 7 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 7 },
  description: "main/grid-01 — dark 'Our caring values' icon row.",
  schema: {
    values: "array of { label, icon } — icon = filename in assets/caring-icons/",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    values: VALUES,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const values = (s.values || VALUES).map((v) => `
      <div class="v2f-mn-grid1-val">
        <span class="ic"><img src="${esc(v.icon.startsWith("assets") ? v.icon : `assets/caring-icons/${v.icon}.svg`)}" alt=""></span>
        <span class="lbl">${esc(v.label)}</span>
      </div>`).join("");
    return `
      <div class="v2f-root v2f-dark">
        ${topBar(s.meta)}
        <div class="v2f-mn-grid1 reveal">
          <div class="v2f-mn-grid1-head">
            <span class="v2f-mn-grid1-word">Our</span>
            <img class="v2f-mn-grid1-scribble" src="${SCRIBBLE}" alt="caring">
            <span class="v2f-mn-grid1-word">values</span>
          </div>
          <div class="v2f-mn-grid1-values">${values}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
