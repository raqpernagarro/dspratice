// Template: brand-guidelines/text-06 — a muted heading over two tinted panels, each with a typeface name set very large and its role above it.
// Source Figma frame 109:14903.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/text-06", slide: 407, figmaNode: "109:14903",
  family: "brand-guidelines", role: "showcase", shape: "cols", theme: "light", chrome: false,
  use: "Primary and secondary typeface side by side",
  media: [], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 0, titles: 3, subtitles: 0, body: 2, stats: 0, icons: 0 },
  description: "brand-guidelines/text-06 — a muted heading over two tinted panels, each with a typeface name set very large and its role above it.",
  intent: {
    bestFor: ["naming the brand typefaces"],
    holds: "a heading and two typefaces, each a name of up to about 12 characters and a role",
    itemChars: 12,
    avoid: ["long names"],
    feel: "statement",
    needs: [],
  },
  schema: {
    title: "string", faces: "array of 2 {name, role}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Subtitle", faces: [{ name: "Equip", role: "Primary typeface" }, { name: "Equip Extended", role: "Secondary typeface" }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "31" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-br-head reveal"><p class="t m">${esc(s.title ?? "")}</p></div>
        <div class="v2f-br-faces reveal">${(s.faces || []).slice(0, 2).map((f) => `<div><p class="r">${esc(f.role ?? "")}</p><p class="n">${esc(f.name ?? "")}</p></div>`).join("")}</div>
        ${brFooter(s.footer)}
      </div>`;
  },
};
