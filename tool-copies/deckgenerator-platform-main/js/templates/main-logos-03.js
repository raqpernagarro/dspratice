// Template: main/logos-03 — a headingless, full-width client logo wall: a 4-column ×
// 5-row grid centred on the slide. Source Figma frame 431:30969 (main/logos-03,
// section 342:43164).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { logoCell } from "./main-logos-01.js";

const LOGOS = ["Bank of Ireland", "SONY", "ERSTE Group", "Sharjah Islamic Bank",
  "Lufthansa", "NetRoadshow", "ahli united bank", "SIEMENS",
  "SanDisk", "Google", "L’Oréal", "Intel",
  "BMW GROUP", "Verizon", "LUTRON", "RMS",
  "MARUTI SUZUKI", "unicef", "Twitter", "Johnson & Johnson"];

export default {
  name: "main/logos-03", slide: -45, figmaNode: "431:30969",
  family: "main", role: "logos", shape: "grid", theme: "light", chrome: false,
  use: "A headingless full-width client logo wall — a 4×5 grid of logos.",
  media: ["logo"], capacity: { items: 20, min: 8, max: 24 },
  slots: { images: 20, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "main/logos-03 — headingless 4×5 full-width logo wall.",
  intent: {
    bestFor: ["clients, partners or certifications shown as logos", "a 'trusted by' proof slide"],
    holds: "8–24 organisation names or logo files; no heading",
    itemChars: 30,
    avoid: ["questions, sentences or descriptions", "anything that is not an organisation",
      "slides that need a title"],
    feel: "visual",
    needs: ["logo files or recognisable organisation names"],
  },
  schema: {
    logos: "array of string | { name, src }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    logos: LOGOS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const wall = (s.logos || LOGOS).map((l) => logoCell(l)).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-logos3 reveal">${wall}</div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
