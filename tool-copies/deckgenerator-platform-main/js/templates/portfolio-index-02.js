// Template: portfolio/index-02 — portfolio table of contents variant: sections
// with right-aligned page *ranges* (e.g. "05 – 12"). Source Figma frame 109:10080.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "portfolio/index-02",
  slide: 69,
  figmaNode: "109:10080",
  family: "portfolio", role: "index", shape: "list", theme: "light", chrome: false,
  use: "Portfolio table of contents with right-aligned page ranges.",
  media: [],
  capacity: { items: 6, min: 2, max: 9 },
  slots: { images: 0, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/index-02 — TOC list with right-aligned page ranges.",
  intent: {
    bestFor: ["the contents of a long portfolio where sections run several pages: shows each section's span (05 – 12)"],
    holds: "3 to 9 short section names; each gets its page range, set by the system",
    itemChars: 28,
    avoid: ["short decks where every section is one slide (use portfolio/index)", "agendas with times or speakers"],
    feel: "airy",
    needs: [],
  },
  schema: {
    items: "array of { label, page }  (page can be a range like '05 – 12')",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    items: [
      { label: "About me", page: "05 – 12" }, { label: "Project 1", page: "17 – 26" },
      { label: "Project 2", page: "27 – 35" }, { label: "Project 3", page: "36 – 46" },
      { label: "Recognition", page: "47 – 49" }, { label: "Contact", page: "51" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "164" },
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
