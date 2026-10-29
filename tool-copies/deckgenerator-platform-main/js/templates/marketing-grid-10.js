// Template: marketing/grid-10 — a small page header over two columns of three tinted quote cards, each with a photo, a quotation and an attribution.
// Source Figma frame 110:30761.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-10", slide: 328, figmaNode: "110:30761",
  family: "marketing", role: "quote", shape: "grid", theme: "light", chrome: false,
  use: "Six short quotes with a photo each, in two columns",
  media: ["photo"], capacity: { items: 6, min: 2, max: 6 },
  slots: { images: 6, titles: 1, subtitles: 1, body: 6, stats: 0, icons: 0 },
  description: "marketing/grid-10 — a small page header over two columns of three tinted quote cards, each with a photo, a quotation and an attribution.",
  intent: {
    bestFor: ["a wall of verbatim audience quotes"],
    holds: "a title and subtitle and two to six quotes of up to about 200 characters with an attribution and a photo each",
    itemChars: 200,
    avoid: ["quotes longer than 200 characters", "no photos"],
    feel: "dense",
    needs: ["photos"],
  },
  schema: {
    title: "string", subtitle: "string", quotes: "array of up to 6 {text, who, image}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Quotes", subtitle: "Audience",
    quotes: Array.from({ length: 6 }, (_, i) => ({ text: "”Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed\ndo eiusmod tempor incididunt ut labore et dolore magna\naliqua. Ut enim ad minim veniam. Lorem ipsum dolor sit\namet, consectetur adipiscing elit”", who: "– Lorem ipsum", image: mkPhoto(i) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "21" },
    footer: MK_FOOTER,
  },
  render(s) {
    const q = (s.quotes || []).slice(0, 6);
    const card = (x) => `<div class="v2f-mk-qcard">${mkImg(x.image, { style: "flex:0 0 212px;" })}<div class="q"><p class="t">${esc(x.text ?? "")}</p><p class="w">${esc(x.who ?? "")}</p></div></div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkSmallHead({ title: s.title, subtitle: s.subtitle }, { mid: true })}
        <div class="v2f-mk-qgrid reveal">${q.map(card).join("")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
