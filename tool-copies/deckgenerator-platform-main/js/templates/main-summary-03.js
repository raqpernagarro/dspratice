// Template: main/summary-03 — "Executive Summary": a heading over the summary set as
// full-width paragraphs directly below. Source Figma frame 342:37323.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const BODY = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nulla at risus. Quisque purus magna, auctor et, sagittis ac, posuere eu, lectus. Nam mattis, felis ut adipiscing. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nulla at risus. Quisque purus magna, auctor et, sagittis ac, posuere eu, lectus. Nam mattis, felis ut adipiscing. Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique.",
];

export default {
  name: "main/summary-03", slide: -74, figmaNode: "342:37323",
  family: "main", role: "content", shape: "single", theme: "light", chrome: false,
  use: "An executive summary with the heading on top and the summary text as full-width paragraphs below.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "main/summary-03 — heading top + full-width summary paragraphs.",
  schema: {
    title: "string — heading", body: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Executive Summary", body: BODY,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-sum3 reveal">
          <p class="v2f-mn-h2">${esc(s.title ?? "Executive Summary")}</p>
          <div class="v2f-mn-sumbody">${body}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
