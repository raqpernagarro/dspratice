// Template: brand-guidelines/grid-11 — a caption and title in a narrow left column; at the right a column of colour bars whose heights show how much of each colour to use.
// Source Figma frame 109:14848.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { brFooter, brPhoto, brImg, brCol, brPanel, brSplit, brTextBlock, brTocRow, brChapter, brHead, brInk, brSwatch, brDot, brPair, brAvoid, brPhone, brTab, brWatch, brPlace, brTree, brRich, brMark, BR_FOOTER, BR_LOREM, BR_SHORT, BR_LOGOS, BR_PRIMARY, BR_SECONDARY } from "../brand-blocks.js";

export default {
  name: "brand-guidelines/grid-11", slide: 404, figmaNode: "109:14848",
  family: "brand-guidelines", role: "chart", shape: "split", theme: "light", chrome: false,
  use: "Colour hierarchy by proportion",
  media: [], capacity: { items: 12, min: 3, max: 14 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "brand-guidelines/grid-11 — a caption and title in a narrow left column; at the right a column of colour bars whose heights show how much of each colour to use.",
  intent: {
    bestFor: ["the proportion in which brand colours are used"],
    holds: "a caption, a title, a paragraph and three to fourteen bars, each a colour and a height",
    itemChars: 250,
    avoid: ["labels on the bars"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string — small eyebrow", title: "string", subtitle: "string — muted second line", body: "string — paragraph at the foot of the column", bars: "array of {color, h} — h in px; h: 0 makes the bar fill the remaining space",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Hierarchy", body: BR_LOREM,
    bars: [{ color: "#ffffff", h: 0 }, { color: "rgba(1,7,22,.5)", h: 40 }, { color: "rgba(1,7,22,.2)", h: 40 }, { color: "#f2f2f3", h: 40 }, { color: "#010716", h: 180 }, { color: "#010716", h: 100 }, { color: "#DB7996", h: 20 }, { color: "#C94B38", h: 20 }, { color: "#CE8C46", h: 20 }, { color: "#D8B958", h: 20 }, { color: "#649F49", h: 20 }, { color: "#76AEEA", h: 20 }], caption: "Colours",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "28" },
    footer: BR_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${brSplit(brCol(s.meta, { caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }), brPanel((s.bars || []).slice(0, 14).map((b) => `<i class="v2f-br-bar" style="background:${esc(b.color ?? "#ccc")};${b.h ? `flex:0 0 ${Number(b.h)}px;` : "flex:1 1 0;"}"></i>`).join(""), { cls: "pad col bars" }))}
        ${brFooter(s.footer)}
      </div>`;
  },
};
