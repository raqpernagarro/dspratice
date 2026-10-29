// Template: marketing/grid-30 — a rounded gradient banner with an eyebrow, a 60px title, a muted subtitle and, along its bottom, chips grouped in four columns; below it four columns of title and paragraph.
// Source Figma frame 110:31237.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, mkPostCard, mkTick, mkCross, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-30", slide: 350, figmaNode: "110:31237",
  family: "marketing", role: "showcase", shape: "row", theme: "light", chrome: false,
  use: "A gradient banner with the chapter title and chips, over four text columns",
  media: [], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 0, titles: 7, subtitles: 1, body: 4, stats: 0, icons: 0 },
  description: "marketing/grid-30 — a rounded gradient banner with an eyebrow, a 60px title, a muted subtitle and, along its bottom, chips grouped in four columns; below it four columns of title and paragraph.",
  intent: {
    bestFor: ["the 360° activation overview: an umbrella idea with four streams and the deliverables of each"],
    holds: "an eyebrow, a title, a subtitle, four columns of one or two chips (up to about 16 characters) and four text blocks with a title and a paragraph of up to about 380 characters",
    itemChars: 380,
    avoid: ["more or fewer than four streams", "chips longer than 16 characters"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", streams: "array of 4 {title, body, chips: string[] (1–2)}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Content", title: "Activation", subtitle: "360°",
    streams: [{ title: "Brand Film", chips: ["60’ Brand Film"] }, { title: "Social Initiatives", chips: ["Concept 1", "Concept 2"] }, { title: "PR & Activations", chips: ["Concept 1", "Concept 2"] }, { title: "Product & KV", chips: ["Product cuts", "KV"] }]
      .map((x) => ({ ...x, body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "43" },
    footer: MK_FOOTER,
  },
  render(s) {
    const st = (s.streams || []).slice(0, 4);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-ban reveal">
          <img class="bg" src="assets/marketing/gradient.png" alt="">
          <div class="tl">${s.caption ? `<p class="c">${esc(s.caption)}</p>` : ""}<p class="t">${esc(s.title ?? "")}</p>${s.subtitle ? `<p class="s">${esc(s.subtitle)}</p>` : ""}</div>
          <div class="cp">${st.map((x) => `<div class="co">${(x.chips || []).slice(0, 2).map((c) => `<span>${esc(c)}</span>`).join("")}</div>`).join("")}</div>
        </div>
        <div class="v2f-mk-4t reveal">${st.map((x) => `<div class="tb"><p class="h">${esc(x.title ?? "")}</p><p class="b">${esc(x.body ?? "")}</p></div>`).join("")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
