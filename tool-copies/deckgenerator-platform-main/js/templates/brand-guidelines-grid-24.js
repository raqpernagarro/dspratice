// Template: brand-guidelines/grid-24 — a caption and title over a tinted card with a “Do” list and a “Don’t” list of sentences, the key words in each set in full colour.
// Source Figma frame 109:15375.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-24", slide: 424, figmaNode: "109:15375",
  family: "brand-guidelines", role: "detail", shape: "list", theme: "light", chrome: false,
  use: "Do's and don'ts as sentences",
  media: [], capacity: { items: 6, min: 2, max: 8 },
  slots: { images: 0, titles: 3, subtitles: 0, body: 6, stats: 0, icons: 2 },
  description: "brand-guidelines/grid-24 — a caption and title over a tinted card with a “Do” list and a “Don’t” list of sentences, the key words in each set in full colour.",
  intent: {
    bestFor: ["writing guidance as concrete do and don't sentences"],
    holds: "a caption, a title and one to four sentences of up to about 50 characters on each side, key words in *asterisks*",
    itemChars: 50,
    avoid: ["long sentences"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", dos: "array of up to 4 strings — key words in *asterisks*", donts: "array of up to 4 strings", doLabel: "string", dontLabel: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Tone of voice", title: "Do’s and Don’ts", doLabel: "Do", dontLabel: "Don’t",
    dos: ["Use *bold, intentional language* that sparks curiosity", "Use specific words that *bring ideas to life*", "Use a tone that feels *human, warm, and real*"],
    donts: ["Use generic phrases that say *nothing new*", "Use *overly polished or robotic language*", "Use jargon that *clouds the message*"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "48" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${brHead({ caption: s.caption, title: s.title }, { big: true })}</div>
        <div class="v2f-br-says reveal"><div><div class="lb">${brMark(true)}<p>${esc(s.doLabel ?? "Do")}</p></div>${(s.dos || []).slice(0, 4).map((t) => `<p class="ln">${brRich(t)}</p>`).join("")}</div>
          <div><div class="lb">${brMark(false)}<p>${esc(s.dontLabel ?? "Don’t")}</p></div>${(s.donts || []).slice(0, 4).map((t) => `<p class="ln">${brRich(t)}</p>`).join("")}</div></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
