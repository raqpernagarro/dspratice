// Template: main/grid-02 — the capabilities wall: a five-column, six-row grid of
// Nagarro service offerings, each an 80px brand icon + label. Source Figma frame
// (main/grid-02, section 342:43164).
import { esc } from "../components.js";
import { icon } from "../icons.js";
import { topBar, footerBar } from "../frame.js";

// 28 offerings in the Figma's reading order (row-major), each paired with the exact
// icon the Figma "Nagarro-Icons" instance uses (from js/icons.js, 126-icon brand set).
const SERVICES = [
  { label: "Agile software development", icon: "stack" },
  { label: "API management", icon: "api" },
  { label: "Application management & support", icon: "person-heart" },
  { label: "Artificial intelligence", icon: "eye" },
  { label: "Big data", icon: "graph-upwards" },
  { label: "Business intelligence", icon: "downward-graph" },
  { label: "Business consulting", icon: "people" },
  { label: "Cloud enablement & integration", icon: "cloud" },
  { label: "CMS & portals", icon: "storyboard" },
  { label: "CRM", icon: "presentation-long" },
  { label: "Data science", icon: "search" },
  { label: "DevOps", icon: "waves" },
  { label: "Digital Marketing", icon: "video" },
  { label: "Digital commerce", icon: "shoping-cart-with-gear" },
  { label: "Embedded systems", icon: "upward-path" },
  { label: "Enterprise resource planning", icon: "building" },
  { label: "Enterprise architecture", icon: "database" },
  { label: "Identity & access management", icon: "compass" },
  { label: "Internet of things", icon: "zig-zag" },
  { label: "Legacy modernization & transformation", icon: "path" },
  { label: "Low code platforms", icon: "shapes" },
  { label: "Metaverse", icon: "affinity-map" },
  { label: "Mobile solution", icon: "phone-on" },
  { label: "Reality technologies", icon: "eye" },
  { label: "Security", icon: "protective-shield" },
  { label: "Test engineering", icon: "spring-path-2" },
  { label: "UX/UI design", icon: "sketch" },
  { label: "Virtual assistant", icon: "user" },
];

export default {
  name: "main/grid-02", slide: -52, figmaNode: "342:37605",
  family: "main", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A dense icon grid of service offerings / capabilities — the 'what we do' wall.",
  media: ["icon"], capacity: { items: 30, min: 12, max: 30 },
  slots: { images: 0, titles: 0, body: 0, stats: 0, icons: 30 },
  description: "main/grid-02 — 5×6 service icon grid.",
  schema: {
    services: "array of { label, icon } — icon = name in js/icons.js",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    services: SERVICES,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cells = (s.services || SERVICES).map((it) => `
      <div class="v2f-mn-grid2-cell">
        <span class="ic">${icon(it.icon)}</span>
        <span class="lbl">${esc(it.label)}</span>
      </div>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-grid2 reveal">${cells}</div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
