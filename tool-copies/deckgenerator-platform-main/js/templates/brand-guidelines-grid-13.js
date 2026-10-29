// Template: brand-guidelines/grid-13 — a caption, title and paragraph in a narrow left column; at the right a tinted panel with the typeface name, its weights set very large, and the alphabet in two cases.
// Source Figma frame 109:14918.
// Also covers brand-guidelines/grid-14 (secondary typeface) (same layout, another state).
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-13", slide: 409, figmaNode: "109:14918",
  family: "brand-guidelines", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "Typeface specimen: name, weights and alphabet",
  media: [], capacity: { items: 3, min: 1, max: 3 },
  slots: { images: 0, titles: 2, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-13 — a caption, title and paragraph in a narrow left column; at the right a tinted panel with the typeface name, its weights set very large, and the alphabet in two cases.",
  intent: {
    bestFor: ["a typeface specimen for the primary or secondary font"],
    holds: "a caption, a title, a paragraph, a label, one to three large lines (name, weights) and up to two alphabet samples",
    itemChars: 20,
    avoid: ["more than three large lines"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", label: "string — e.g. Primary typeface", lines: "array of 1–3 strings — the first in full colour, the rest muted", samples: "array of up to 2 strings — line breaks allowed", sampleFace: "body | display — set the samples in Equip (primary typeface, default) or Equip Extended (secondary)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Typography", body: BR_LOREM, label: "Primary typeface", lines: ["Equip", "Regular"],
    samples: ["abcdefghklmnopqrstuvwxyz\nABCDEFGHKLMNOPQRSTUVWXYZ", "abcdefghklmnopqrstuvwxyz\nABCDEFGHKLMNOPQRSTUVWXYZ"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "33" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), brPanel(`<p class="v2f-br-h36">${esc(s.label ?? "")}</p><div class="v2f-br-spec">${(s.lines || []).slice(0, 3).map((l, i) => `<p${i ? ' class="m"' : ""}>${esc(l)}</p>`).join("")}</div><div class="v2f-br-abc${s.sampleFace === "display" ? " disp" : ""}">${(s.samples || []).slice(0, 2).map((x) => `<p>${esc(x)}</p>`).join("")}</div>`, { cls: "pad col g32" }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
