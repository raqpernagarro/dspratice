// Template: case-study/index — the case study's chapter list: up to five large
// numbered chapter names, with the client and project below. Source Figma
// frame 110:40131.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { csClient, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/index", slide: 237, figmaNode: "110:40131",
  family: "case-study", role: "toc", shape: "list", theme: "light", chrome: false,
  use: "The chapters of a case study as a large numbered list.",
  media: [], capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 0, titles: 0, body: 0, stats: 0, icons: 0, list: 5 },
  description: "case-study/index — large numbered chapter list (01 Brief … 05 Results).",
  intent: {
    bestFor: ["the chapters of a case study, in order", "an agenda of three to five sections"],
    holds: "3–5 chapter names of one word each, numbered automatically; the client and project",
    itemChars: 14,
    avoid: ["chapter names longer than one or two words", "more than five chapters", "page numbers"],
    feel: "statement",
    needs: [],
  },
  schema: {
    items: "array of 3–5 chapter names (numbered automatically)", client: "string", project: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    items: ["Brief", "Scope", "Process", "Concept", "Results"], client: "Client", project: "Project",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "03" },
    footer: CS_FOOTER,
  },
  render(s) {
    const rows = (s.items || []).slice(0, 5).map((label, i) => `
      <div class="v2f-cs-index-row"><span class="n">${String(i + 1).padStart(2, "0")}</span><span>${esc(label)}</span></div>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-index reveal">${rows}</div>
        ${csClient(s)}
        ${csFooter(s.footer)}
      </div>`;
  },
};
