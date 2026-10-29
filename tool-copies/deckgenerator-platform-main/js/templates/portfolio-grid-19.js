// Template: portfolio/grid-19 — a "Notations" heading on the left, a stack of
// short testimonial quotes with attribution on the right. Source Figma frame
// 109:10696.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/grid-19",
  slide: 109,
  figmaNode: "109:10696",
  family: "portfolio", role: "quote", shape: "split", theme: "light", chrome: false,
  use: "A heading on the left, a stack of short testimonial quotes with attribution on the right.",
  media: [],
  capacity: { items: 3, min: 2, max: 4 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 3, stats: 0, icons: 0 },
  description: "portfolio/grid-19 — heading left, stacked testimonial quotes right.",
  schema: {
    title: "string", quotes: "array of { quote, attribution }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Notations",
    quotes: [
      { quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.", attribution: "Lorem ipsum" },
      { quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.", attribution: "Lorem ipsum" },
      { quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", attribution: "Lorem ipsum" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "204" },
  },
  render(s) {
    const items = (s.quotes || [])
      .map((q) => `<div class="v2f-pf-qitem"><p class="q">“${esc(q.quote ?? "")}”</p>${q.attribution ? `<p class="by">– ${esc(q.attribution)}</p>` : ""}</div>`)
      .join("");
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c"><p class="v2f-pf-lead">${esc(s.title ?? "")}</p></div>
        <div class="c"><div class="v2f-pf-quotes">${items}</div></div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
