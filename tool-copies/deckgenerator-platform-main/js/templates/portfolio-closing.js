// Template: portfolio/closing — the closing: an oversized muted sign-off such as
// "Thank you!", vertically centred. Source Figma frame 109:10884 (renamed from
// portfolio/text-16 in Figma; that name stays registered, retired, for the
// saved decks that use it).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "portfolio/closing",
  slide: 116,
  figmaNode: "109:10884",
  family: "portfolio", role: "closing", shape: "single", theme: "light", chrome: false,
  use: "The closing: an oversized muted sign-off, vertically centered.",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/closing — oversized muted sign-off (e.g. Thank you!).",
  intent: {
    bestFor: ["the last slide of a portfolio or project deck: a one- or two-word sign-off"],
    holds: "a sign-off of one to three words",
    itemChars: 20,
    avoid: ["anything other than the final slide", "sentences, contact details or a call to action"],
    feel: "statement",
    needs: [],
  },
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
