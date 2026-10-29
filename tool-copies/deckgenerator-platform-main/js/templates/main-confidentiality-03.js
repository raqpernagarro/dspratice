// Template: main/confidentiality-03 — a confidentiality statement with the heading
// at the top and the paragraph anchored to the bottom. Source frame 342:37291.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "main/confidentiality-03", slide: -78, figmaNode: "342:37291",
  family: "main", role: "statement", shape: "single", theme: "light", chrome: false,
  use: "A confidentiality / legal statement with the heading at the top and the paragraph at the bottom.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "main/confidentiality-03 — heading top, paragraph bottom.",
  schema: {
    title: "string — heading", body: "string — statement paragraph",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Confidentiality Statement",
    body: "This document contains proprietary and confidential information and shall not be used, reproduced, or disclosed to third parties, in whole or in part, for any purpose other than to evaluate this document, without the prior written consent of Nagarro.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-conf split reveal">
          ${s.title ? `<p class="v2f-mn-h2">${esc(s.title)}</p>` : ""}
          ${s.body ? `<p class="para">${esc(s.body)}</p>` : ""}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
