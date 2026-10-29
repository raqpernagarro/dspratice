// Template: main/about-01 — a bold heading on the left with supporting grey body
// copy on the right, vertically centred. Source Figma frame 342:37450.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "main/about-01", slide: -60, figmaNode: "342:37450",
  family: "main", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A bold heading on the left with supporting grey body paragraphs on the right.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 3, stats: 0, icons: 0 },
  description: "main/about-01 — heading left + body right, vertically centred.",
  schema: {
    title: "string — heading", body: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Nagarro is a global leader in technology and human centered digital solutions.",
    body: [
      "Our clients need to become digital-first companies that compete through superior software platforms.",
      "Nagarro helps them transform, adapt, and build new ways into the future through an entrepreneurial, agile, and caring mindset. Our clients need to become digital-first companies that compete through superior software platforms.",
      "Nagarro helps them transform, adapt, and build new ways into the future through an entrepreneurial, agile, and caring mindset.",
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-about1 reveal">
          <div class="v2f-mn-about1-head"><p class="v2f-mn-h">${esc(s.title ?? "")}</p></div>
          <div class="v2f-mn-about1-body"><div class="v2f-mn-prose airy">${body}</div></div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
