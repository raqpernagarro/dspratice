// Template: portfolio/text-16 — the closing: an oversized muted "Thank you!"
// vertically centered. Source Figma frame 109:10884.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "portfolio/text-16",
  // Renamed to portfolio/closing in Figma. Kept registered so the saved decks
  // that use this name still render; never offered for new slides.
  replacedBy: "portfolio/closing",
  slide: 116,
  figmaNode: "109:10884",
  family: "portfolio", role: "closing", shape: "single", theme: "light", chrome: false,
  use: "The closing: an oversized muted sign-off, vertically centered.",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/text-16 — oversized muted closing word.",
  schema: {
    word: "string — the sign-off",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    word: "Thank you!",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "211" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-pf-bigword reveal"><p>${esc(s.word ?? "")}</p></div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
