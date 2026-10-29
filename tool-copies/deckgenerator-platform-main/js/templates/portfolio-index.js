// Template: portfolio/index — portfolio table of contents: a list of sections
// (About me / Project 1 / …) with right-aligned grey page numbers. Big Equip
// Extended rows under the top bar. Source Figma frame 109:10066.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "portfolio/index",
  slide: 68,
  figmaNode: "109:10066",
  family: "portfolio", role: "index", shape: "list", theme: "light", chrome: false,
  use: "Portfolio index / table of contents: sections with right-aligned page numbers.",
  media: [],
  capacity: { items: 6, min: 2, max: 9 },
  slots: { images: 0, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/index — TOC list with right-aligned page numbers.",
  intent: {
    bestFor: ["the contents of a portfolio or a long deck: where each section starts"],
    holds: "3 to 9 short section names; each gets the page its section starts on",
    itemChars: 28,
    avoid: ["agendas with times or speakers", "when readers need to see how long each section is (use portfolio/index-02)"],
    feel: "airy",
    needs: [],
  },
  schema: {
    items: "array of { label, page }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    items: [
      { label: "About me", page: "05" }, { label: "Project 1", page: "17" },
      { label: "Project 2", page: "27" }, { label: "Project 3", page: "36" },
      { label: "Recognition", page: "47" }, { label: "Contact", page: "51" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "163" },
  },
  render(s) {
    const rows = (s.items || [])
      .map((it) => `<div class="v2f-pf-indexrow"><span class="lbl">${esc(it.label ?? "")}</span><span class="pg">${esc(it.page ?? "")}</span></div>`)
      .join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-pf-index reveal">${rows}</div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
