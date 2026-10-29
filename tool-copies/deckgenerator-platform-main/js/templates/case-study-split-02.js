// Template: case-study/split-02 — the brief as one strong sentence: an eyebrow
// and a large headline on the left, a photo sitting on the bottom edge at the
// right. Source Figma frame 110:40148.
import { topBar } from "../frame.js";
import { csHead, csClient, csImg, csPhoto, csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/split-02", slide: 239, figmaNode: "110:40148",
  family: "case-study", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "One headline that sums up the project, beside a photo set low on the right.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "case-study/split-02 — eyebrow + large headline left, low photo right.",
  intent: {
    bestFor: ["the project in one sentence: the tagline and what it achieved", "a single strong claim backed by a photo"],
    holds: "an eyebrow of 1–2 words and a headline of up to about 90 characters; the client and project; one photo",
    itemChars: 90,
    avoid: ["lists or several points", "paragraphs of explanation", "figures that need a chart"],
    feel: "statement",
    needs: ["a photo of the work"],
  },
  schema: {
    caption: "string", title: "string — one sentence", client: "string", project: "string",
    image: "string — photo path", meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Brief",
    title: "Present the project with a captivating tagline and a brief overview of the results.",
    client: "Client", project: "Project", image: csPhoto(2),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "05" },
    footer: CS_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal">
          <div class="v2f-cs-col" style="flex:0 0 968px;">
            ${csHead({ caption: s.caption, title: s.title })}
            ${csClient(s)}
          </div>
          ${csImg(s.image, { cls: "v2f-cs-img--bottom", style: "width:848px;height:644px;" })}
        </div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
