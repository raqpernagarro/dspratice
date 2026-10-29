// Template: brand-guidelines/cover — cover with a very large title and a muted subtitle, the company and date at the bottom left.
// Source Figma frame 109:14480.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/cover", slide: 377, figmaNode: "109:14480",
  family: "brand-guidelines", role: "cover", shape: "single", theme: "light", chrome: false,
  use: "Cover for a brand guidelines document",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 2, stats: 0, icons: 0 },
  description: "brand-guidelines/cover — cover with a very large title and a muted subtitle, the company and date at the bottom left.",
  intent: {
    bestFor: ["opening a brand guidelines or brand book"],
    holds: "a title of up to about 20 characters, a subtitle, the company and a date",
    itemChars: 20,
    avoid: ["long titles", "images"],
    feel: "statement",
    needs: [],
  },
  schema: {
    title: "string — up to about 20 characters", subtitle: "string", company: "string", date: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Title here", subtitle: "Brand guidelines", company: "© Company", date: "Date",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-cover reveal"><p class="t">${esc(s.title ?? "")}</p><p class="s">${esc(s.subtitle ?? "")}</p></div>
        <div class="v2f-br-cobot reveal"><p>${esc(s.company ?? "")}</p><p>${esc(s.date ?? "")}</p></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
