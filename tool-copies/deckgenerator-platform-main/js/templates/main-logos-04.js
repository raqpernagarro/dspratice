// Template: main/logos-04 — the industry-segmented logo wall: a heading over two
// columns of category blocks (category label + a row of client logos). Source Figma
// frame (main/logos-04, section 342:43164).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { logoCell } from "./main-logos-01.js";

// Per-logo heights (px) measured from the Figma frame 342:38507 so each mark sits at
// its intended optical size and every category fits on one line. A logo may also be a
// { text } note (e.g. the consulting-firms caption).
const COLUMNS = [
  [
    { cat: "Financial Services and Insurance", logos: [
      { name: "Bank of Ireland", h: 56 }, { name: "ERSTE Group", h: 56 },
      { name: "NetRoadshow", h: 24 }, { name: "SAXO", h: 48 }] },
    { cat: "Automotive, Manufacturing and Industrial", logos: [
      { name: "Audi", h: 32 }, { name: "BMW GROUP", h: 56 },
      { name: "MARUTI SUZUKI", h: 32 }, { name: "SIEMENS", h: 28 }] },
    { cat: "Travel and Logistics", logos: [
      { name: "Arriva", h: 56 }, { name: "DB", h: 48 }, { name: "Lufthansa", h: 36 },
      { name: "ÖBB", h: 32 }, { name: "STAR ALLIANCE", h: 56 }] },
    { cat: "Telecom, Media and Entertainment", logos: [
      { name: "A1", h: 56 }, { name: "ADMIRAL", h: 32 }, { name: "NETENT", h: 38 },
      { name: "T", h: 56 }, { name: "Verizon", h: 36 }] },
    { cat: "Retail and CPG", logos: [
      { name: "Amway", h: 56 }, { name: "coop", h: 40 }, { name: "dm", h: 56 }, { name: "VF", h: 56 }] },
  ],
  [
    { cat: "Energy, Utilities and Building Automation", logos: [
      { name: "ASSA ABLOY", h: 28 }, { name: "Avista", h: 32 },
      { name: "ENGIE", h: 48 }, { name: "Verbund", h: 32 }] },
    { cat: "Public, Non-profit and Education", logos: [
      { name: "blackbaud", h: 32 }, { name: "NYC", h: 32 }, { name: "New York State", h: 56 },
      { name: "PLAKSHA", h: 64 }, { name: "unicef", h: 36 }, { name: "WWF", h: 64 }] },
    { cat: "Life Sciences and Healthcare", logos: [
      { name: "KLOSTERFRAU", h: 56 }, { name: "RADIOMETER", h: 32 }] },
    { cat: "Horizontal Tech", logos: [
      { name: "emitac", h: 48 }, { name: "Tungsten Network", h: 56 }] },
    { cat: "Management Consulting and Business Information", logos: [
      { name: "RELX", h: 40 }, { name: "RMS", h: 56 },
      { text: "2 of the Big 3 management consulting firms" }] },
  ],
];

export default {
  name: "main/logos-04", slide: -44, figmaNode: "342:38507",
  family: "main", role: "logos", shape: "grid", theme: "light", chrome: false,
  use: "An industry-segmented client logo wall — categories in two columns, each a labelled row of logos.",
  media: ["logo"], capacity: { items: 10, min: 4, max: 12 },
  slots: { images: 40, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/logos-04 — heading + two columns of category-labelled logo rows.",
  schema: {
    title: "string",
    columns: "array of two arrays of { cat, logos:[string|{name,src}] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Working with the leaders in each industry",
    columns: COLUMNS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cols = (s.columns || COLUMNS).map((col) => `
      <div class="v2f-mn-logos4-col">
        ${(col || []).map((g) => `
          <div class="v2f-mn-logos4-group">
            <p class="cat">${esc(g.cat)}</p>
            <div class="row">${(g.logos || []).map((l) => l && l.text
              ? `<p class="note">${esc(l.text)}</p>`
              : logoCell(l)).join("")}</div>
          </div>`).join("")}
      </div>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-logos4 reveal">
          <p class="v2f-mn-h">${esc(s.title ?? "")}</p>
          <div class="v2f-mn-logos4-groups">${cols}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
