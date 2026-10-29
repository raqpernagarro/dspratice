// Template: main/data-02 — a short label on the left with a large grey impact
// statement on the right. Source Figma frame 342:37473.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "main/data-02", slide: -57, figmaNode: "342:37473",
  family: "main", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A short section label on the left paired with a large grey impact statement on the right.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "main/data-02 — label left + large grey statement right.",
  schema: {
    title: "string — label", statement: "string — the large statement",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Our Impact",
    statement: "Creating seamless experiences across every platform and product. Our comprehensive design process accelerates innovation, enabling rapid production while reducing costs.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-data2 reveal">
          <div class="v2f-mn-data2-head"><p class="v2f-mn-h">${esc(s.title ?? "Our Impact")}</p></div>
          <div class="v2f-mn-data2-body"><p class="stmt">${esc(s.statement ?? "")}</p></div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
