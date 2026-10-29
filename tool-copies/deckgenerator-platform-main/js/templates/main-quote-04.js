// Template: main/quote-04 — a centred, two-tier statement quote (a smaller lead line
// over a larger main line) with an attribution. Source Figma frame 342:37386.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "main/quote-04", slide: -64, figmaNode: "342:37386",
  family: "main", role: "quote", shape: "single", theme: "light", chrome: false,
  use: "A centred statement quote in two sizes — a smaller lead line above a larger emphasised line — with an attribution.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 2, body: 0, stats: 0, icons: 0 },
  description: "main/quote-04 — centred two-tier quote + attribution.",
  schema: {
    lead: "string — smaller lead line (opening quote mark)",
    main: "string — larger emphasised line (closing quote mark)",
    name: "string — attribution",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    lead: "“Full page quote or sentence.",
    main: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.”",
    name: "Name goes here",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-q v2f-mn-q4 reveal">
          ${s.lead ? `<p class="v2f-mn-quote lead">${esc(s.lead)}</p>` : ""}
          ${s.main ? `<p class="v2f-mn-quote main">${esc(s.main)}</p>` : ""}
          ${s.name ? `<p class="v2f-mn-qattr">— ${esc(s.name)}</p>` : ""}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
