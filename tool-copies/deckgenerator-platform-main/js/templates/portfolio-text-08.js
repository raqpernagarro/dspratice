// Template: portfolio/text-08 — a "Notations" heading on the left, a large
// testimonial quote with attribution on the right. Source Figma frame 109:10409.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/text-08",
  slide: 90,
  figmaNode: "109:10409",
  family: "portfolio", role: "quote", shape: "split", theme: "light", chrome: false,
  use: "A heading on the left, a large testimonial quote with attribution on the right.",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "portfolio/text-08 — heading left, testimonial quote right.",
  schema: {
    title: "string", quote: "string", attribution: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Notations",
    quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    attribution: "Client Name, 2025",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "185" },
  },
  render(s) {
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c"><p class="v2f-pf-lead">${esc(s.title ?? "")}</p></div>
        <div class="c">
          <div class="v2f-pf-testi">
            <p class="q">“${esc(s.quote ?? "")}”</p>
            ${s.attribution ? `<p class="by">– ${esc(s.attribution)}</p>` : ""}
          </div>
        </div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
