// Template: case-study/cover-01 — a chapter divider: a faint large number beside
// the chapter title, centred on an otherwise empty slide. Source Figma frame
// 110:40142. Figma repeats this layout for chapters 02–05 (cover-02 … cover-05)
// with only the number and title changed.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { csClient, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/cover-01", slide: 238, figmaNode: "110:40142",
  family: "case-study", role: "divider", shape: "single", theme: "light", chrome: false,
  use: "A chapter divider: a faint chapter number beside the chapter title.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "case-study/cover-01 — chapter divider, faint number + chapter title.",
  intent: {
    bestFor: ["opening a chapter of a case study (Brief, Scope, Process, Concept, Results)"],
    holds: "a two-digit chapter number and a chapter title of 1–4 words; the client and project",
    itemChars: 40,
    avoid: ["sentences or body text", "anything that is not a chapter break"],
    feel: "airy",
    needs: [],
  },
  schema: {
    number: "string — two digits, e.g. 01", title: "string", client: "string", project: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    number: "01", title: "Section header", client: "Client", project: "Project",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "04" },
    footer: CS_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-divider reveal"><span class="n">${esc(s.number ?? "01")}</span><span class="t">${esc(s.title)}</span></div>
        ${csClient(s)}
        ${csFooter(s.footer)}
      </div>`;
  },
};
