// Template: finance/divider — a big-word section break (e.g. "Appendix"): the
// shared chrome + one large bold display word filling the slide. Light theme.
// Source Figma frame 110:18900 (finance/text-02).
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "finance/divider",
  slide: 138,
  figmaNode: "110:18900",
  family: "finance",
  role: "divider",
  shape: "single",
  theme: "light",
  chrome: false,
  use: "A minimal section break: one large bold word (e.g. Appendix) marking a new part of the report.",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "finance/divider — one large bold display word, full slide.",
  schema: {
    title: "string — the section word",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Appendix",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "305" },
  },
  render(s) {
    const middle = `<div class="v2f-fin-divider reveal"><p class="w">${esc(s.title ?? "")}</p></div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
