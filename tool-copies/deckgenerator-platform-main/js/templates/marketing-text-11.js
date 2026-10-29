// Template: marketing/text-11 — a 60px title with a subtitle at the left; at the right two 48px quotations, each with a round portrait, name and age.
// Source Figma frame 110:30773.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-11", slide: 329, figmaNode: "110:30773",
  family: "marketing", role: "quote", shape: "split", theme: "light", chrome: false,
  use: "A page header with two large quotes from named people",
  media: ["photo"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 1, subtitles: 1, body: 2, stats: 0, icons: 0 },
  description: "marketing/text-11 — a 60px title with a subtitle at the left; at the right two 48px quotations, each with a round portrait, name and age.",
  intent: {
    bestFor: ["two strong audience quotes read in full"],
    holds: "a title and subtitle and two quotes of up to about 130 characters with a name, an age line and a portrait",
    itemChars: 130,
    avoid: ["more than two quotes", "quotes longer than 130 characters"],
    feel: "statement",
    needs: ["2 portraits"],
  },
  schema: {
    title: "string", subtitle: "string", quotes: "array of 2 {text, name, age, image}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Quotes", subtitle: "Audience",
    quotes: [0, 1].map((i) => ({ name: "Silvia", age: "20 years old", image: mkPhoto(i), text: "“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.”" })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "22" },
    footer: MK_FOOTER,
  },
  render(s) {
    const quote = (x) => `<div class="v2f-mk-bq"><div class="who"><span class="av">${x.image ? `<img src="${esc(x.image)}" alt="">` : ""}</span><div><p class="n">${esc(x.name ?? "")}</p><p class="a">${esc(x.age ?? "")}</p></div></div><p class="t">${esc(x.text ?? "")}</p></div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal" style="gap:32px;">
          <div style="flex:0 0 650px;"><div class="v2f-mk-ph"><div class="hd"><p class="v2f-cs-h2">${esc(s.title ?? "")}</p><p class="v2f-cs-h4 v2f-cs-muted">${esc(s.subtitle ?? "")}</p></div></div></div>
          <div class="v2f-mk-bqs">${(s.quotes || []).slice(0, 2).map(quote).join("")}</div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
