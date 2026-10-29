// Template: brand-guidelines/hero-01 — a caption, title and subtitle at the left and a large statement at the right; on a slate background, or white with `dark: false`.
// Source Figma frame 109:14499.
// Also covers brand-guidelines/text-02 (white) (same layout, another state).
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/hero-01", slide: 380, figmaNode: "109:14499",
  family: "brand-guidelines", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "Big statement beside its heading",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/hero-01 — a caption, title and subtitle at the left and a large statement at the right; on a slate background, or white with `dark: false`.",
  intent: {
    bestFor: ["a statement of purpose, promise or positioning"],
    holds: "a caption, a title, a subtitle and a statement of up to about 240 characters",
    itemChars: 240,
    avoid: ["long statements", "lists"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", body: "string — the statement", dark: "boolean — slate background (default true)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Title", subtitle: "Subtitle", body: BR_LOREM, dark: true, caption: "Caption",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "04" },
    footer: BR_FOOTER,
  },
  render(s) {
    const dark = s.dark !== false;
    return `
      <div class="v2f-root v2f-g32${dark ? " v2f-dark v2f-br-slate" : ""}">
        ${topBar(s.meta)}
        <div class="v2f-br-stmt reveal">
          <div class="hd"><p class="c">${esc(s.caption ?? "")}</p><p class="t">${esc(s.title ?? "")}</p><p class="s">${esc(s.subtitle ?? "")}</p></div>
          <p class="b">${esc(s.body ?? "")}</p>
        </div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
