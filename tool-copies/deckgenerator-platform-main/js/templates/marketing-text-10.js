// Template: marketing/text-10 — a small page header, then a photo at the left and two 150px percentages with a 60px muted sentence each, and a source line.
// Source Figma frame 110:30747.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-10", slide: 327, figmaNode: "110:30747",
  family: "marketing", role: "results", shape: "split", theme: "light", chrome: false,
  use: "Two very large percentages with a sentence each, beside a photo",
  media: ["photo"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 3, stats: 2, icons: 0 },
  description: "marketing/text-10 — a small page header, then a photo at the left and two 150px percentages with a 60px muted sentence each, and a source line.",
  intent: {
    bestFor: ["two survey results that deserve to be read at a glance"],
    holds: "a title and subtitle, two figures (value of up to 4 characters with a sentence of up to about 60 characters), a source and a photo",
    itemChars: 60,
    avoid: ["more than two figures", "long sentences"],
    feel: "data",
    needs: ["a photo"],
  },
  schema: {
    title: "string", subtitle: "string", image: "string — photo path", metrics: "array of 2 {value, text}", source: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Quotes", subtitle: "Audience", image: mkPhoto(3),
    metrics: [{ value: "58%", text: "of the audience say that the product sparks curiosity" }, { value: "70%", text: "say that the product smells good and is aesthetically pleasing" }],
    source: "Source: Tech report, 2025",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "20" },
    footer: MK_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkSmallHead({ title: s.title, subtitle: s.subtitle }, { mid: true })}
        <div class="v2f-cs-cols reveal" style="gap:32px;">
          ${mkImg(s.image, { style: "flex:0 0 728px;" })}
          <div class="v2f-mk-bigm">
            <div class="ls">${(s.metrics || []).slice(0, 2).map((m) => `<div class="m"><p class="v">${esc(m.value ?? "")}</p><p class="t">${esc(m.text ?? "")}</p></div>`).join("")}</div>
            <p class="src">${esc(s.source ?? "")}</p>
          </div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
