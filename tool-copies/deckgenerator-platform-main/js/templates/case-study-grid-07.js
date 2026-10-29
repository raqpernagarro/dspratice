// Template: case-study/grid-07 — the concepts: a headline, then a short "> item"
// list with the client and project below it, beside a photo. Source Figma frame
// 110:40240.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { csHead, csClient, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/grid-07", slide: 249, figmaNode: "110:40240",
  family: "case-study", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A headline, then a short list of up to three large items beside a photo.",
  media: ["photo"], capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 1, titles: 1, body: 0, stats: 0, icons: 0, list: 3 },
  description: "case-study/grid-07 — eyebrow + headline, '> item' list left, photo right.",
  intent: {
    bestFor: ["the concepts or ideas developed for the client, named in a few words each",
      "two or three named options before they are explained one by one"],
    holds: "an eyebrow, a headline of up to about 80 characters, 2–3 items of 1–3 words, the client and project, one photo",
    itemChars: 22,
    avoid: ["explanations of each item (use one slide per concept)", "more than three items", "items with figures"],
    feel: "visual",
    needs: ["a photo of the concepts or the work"],
  },
  schema: {
    caption: "string", title: "string", items: "array of 2–3 short strings", client: "string", project: "string",
    image: "string — photo path", meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Concept", title: "Articulate the concepts you developed for the service, product, or brand.",
    items: ["Concept 1", "Concept 2", "Concept 3"], client: "Client", project: "Project", image: csPhoto(1),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "15" },
    footer: CS_FOOTER,
  },
  render(s) {
    const items = (s.items || []).slice(0, 3)
      .map((it) => `<div class="v2f-cs-li"><span class="m">&gt;</span><span>${esc(it)}</span></div>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${csHead({ caption: s.caption, title: s.title }, { maxWidth: 1200 })}
        <div class="v2f-cs-cols reveal">
          <div class="v2f-cs-col"><div class="v2f-cs-list" style="flex:0 0 auto;">${items}</div>${csClient(s)}</div>
          ${csImg(s.image, { style: "flex:0 0 848px;" })}
        </div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
