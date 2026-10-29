// Template: brand-guidelines/cover-01 — a caption and title over a manifesto set in large muted type.
// Source Figma frame 109:15289.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/cover-01", slide: 420, figmaNode: "109:15289",
  family: "brand-guidelines", role: "statement", shape: "single", theme: "light", chrome: false,
  use: "Manifesto in large type",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/cover-01 — a caption and title over a manifesto set in large muted type.",
  intent: {
    bestFor: ["the brand manifesto or a tone-of-voice statement"],
    holds: "a caption, a title and a statement of up to about 240 characters",
    itemChars: 240,
    avoid: ["long text", "lists"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string — the manifesto; line breaks are kept",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Manifesto", body: "Lorem ipsum dolor sit amet, consectetur\nadipiscing elit, sed do eiusmod tempor\nincididunt ut labore et dolore magna\naliqua. Ut enim ad minim veniam, quis\nnostrud exercitation ullamco laboris nisi ut\naliquip ex ea commodo consequat.", caption: "Tone of voice",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "44" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-mani reveal"><div class="hd"><p class="c">${esc(s.caption ?? "")}</p><p class="t">${esc(s.title ?? "")}</p></div><p class="b">${esc(s.body ?? "")}</p></div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
