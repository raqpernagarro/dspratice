// Template: main/overview-01 — a text overview: a heading + subtitle over a body of
// paragraphs set in the left column. Source Figma frame 342:37299.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const para = (p) => `<p>${esc(p)}</p>`;

export default {
  name: "main/overview-01", slide: -77, figmaNode: "342:37299",
  family: "main", role: "content", shape: "single", theme: "light", chrome: false,
  use: "A text-heavy overview: a heading and subtitle above a couple of body paragraphs in the left column.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 2, stats: 0, icons: 0 },
  description: "main/overview-01 — heading + subtitle + body prose in the left column.",
  schema: {
    title: "string — heading", subtitle: "string", body: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Proposal Overview", subtitle: "Subtitle",
    body: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nulla at risus. Quisque purus magna, auctor et, sagittis ac, posuere eu, lectus. Nam mattis, felis ut adipiscing.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa.",
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "412" },
  },
  render(s) {
    const body = (s.body || []).map(para).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-ovw reveal">
          <div class="v2f-mn-ovw-head">
            ${s.title ? `<p class="v2f-mn-h2">${esc(s.title)}</p>` : ""}
            ${s.subtitle ? `<p class="v2f-mn-sub">${esc(s.subtitle)}</p>` : ""}
          </div>
          <div class="v2f-mn-ovw-body"><div class="v2f-mn-prose airy">${body}</div></div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
