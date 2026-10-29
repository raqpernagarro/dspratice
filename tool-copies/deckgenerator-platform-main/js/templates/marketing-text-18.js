// Template: marketing/text-18 — a small header, then two rows of three example images each followed by a note with a green tick (Do) or a red cross (Don't) and a sentence.
// Source Figma frame 110:31140.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, mkPhonePost, mkPostCard, mkTick, mkCross, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-18", slide: 347, figmaNode: "110:31140",
  family: "marketing", role: "gallery", shape: "grid", theme: "light", chrome: false,
  use: "Six example images in two rows, each row with a Do or Don't note",
  media: ["photo"], capacity: { items: 6, min: 6, max: 6 },
  slots: { images: 6, titles: 3, subtitles: 1, body: 2, stats: 0, icons: 2 },
  description: "marketing/text-18 — a small header, then two rows of three example images each followed by a note with a green tick (Do) or a red cross (Don't) and a sentence.",
  intent: {
    bestFor: ["showing right and wrong executions side by side with a rule for each"],
    holds: "a title and subtitle, six images (three per row) and a Do note and a Don't note of up to about 130 characters each",
    itemChars: 130,
    avoid: ["no images", "notes longer than 130 characters"],
    feel: "visual",
    needs: ["6 images"],
  },
  schema: {
    title: "string", subtitle: "string", dos: "{text, images: string[3]}", donts: "{text, images: string[3]}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Do’s & Don’ts", subtitle: "Messaging",
    dos: { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", images: [0, 1, 2].map((i) => mkPhoto(i)) },
    donts: { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", images: [3, 4, 5].map((i) => mkPhoto(i)) },
    meta: { studio: "Product Studio", name: "Presentation Name", page: "40" },
    footer: MK_FOOTER,
  },
  render(s) {
    const row = (r = {}, ic, label) => `<div class="rw">${[0, 1, 2].map((i) => mkImg((r.images || [])[i])).join("")}<div class="tx"><div class="ti">${ic}<p>${label}</p></div><p class="b">${esc(r.text ?? "")}</p></div></div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkSmallHead({ title: s.title, subtitle: s.subtitle }, { mid: true })}
        <div class="v2f-mk-dd2 reveal">${row(s.dos, mkTick(28), "Do")}${row(s.donts, mkCross(28), "Don’t")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
