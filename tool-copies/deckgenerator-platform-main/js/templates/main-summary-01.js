// Template: main/summary-01 — "Executive Summary": a heading on the left with the
// summary set in two columns on the right. Source Figma frame 342:37307.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const BODY = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nulla at risus. Quisque purus magna, auctor et, sagittis ac, posuere eu, lectus. Nam mattis, felis ut adipiscing. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nulla at risus. Quisque purus magna, auctor et, sagittis ac, posuere eu, lectus. Nam mattis, felis ut adipiscing. Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique.",
];

export default {
  name: "main/summary-01", slide: -76, figmaNode: "342:37307",
  family: "main", role: "content", shape: "split", theme: "light", chrome: false,
  use: "An executive summary: a heading on the left with the summary text set in two columns on the right.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "main/summary-01 — heading left + two-column summary body.",
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
        <div class="v2f-mn-sum1 reveal">
          <div class="v2f-mn-sum1-head"><p class="v2f-mn-h2">${esc(s.title ?? "Executive Summary")}</p></div>
          <div class="v2f-mn-sumbody">${body}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
