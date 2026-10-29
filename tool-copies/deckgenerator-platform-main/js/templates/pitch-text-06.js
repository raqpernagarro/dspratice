// Template: pitch/text-06 — a statement with two paragraphs of explanation beside a full-height
// photo.
// Source Figma frame 110:37073.
import { esc } from "../components.js";
import { topBar, pageHeader } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptPhone, ptHand, ptFeature, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/text-06", slide: 274, figmaNode: "110:37073",
  family: "pitch", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "A statement of up to about 130 characters and two short paragraphs beside a full-height photo.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 2, stats: 0, icons: 0 },
  description: "pitch/text-06 — eyebrow + statement + two paragraphs, photo at the right.",
  intent: {
    bestFor: ["explaining the product: what it offers, the value it provides, what it looks like", "a statement that needs two paragraphs of detail and a picture"],
    holds: "an eyebrow of 1–2 words, a statement of up to about 130 characters, and one or two paragraphs of up to about 200 characters each; one photo",
    itemChars: 130,
    avoid: ["lists or figures", "more than two paragraphs"],
    feel: "dense",
    needs: ["a photo"],
  },
  schema: {
    caption: "string", title: "string — the statement", paragraphs: "array of 1–2 strings", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Product", title: "Elaborate on how your idea will change the world. What are you offering, what value does it provide, and what does it look like?",
    paragraphs: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."], image: ptPhoto(6),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "14" },
    footer: PT_FOOTER,
  },
  render(s) {
    const paras = (s.paragraphs || []).filter(Boolean).slice(0, 2).map((p) => `<p class="v2f-pt-body" style="max-width:600px;">${esc(p)}</p>`).join("");
    const left = ptCol(s.meta, `
      ${ptHead({ caption: s.caption, title: s.title }, { size: "h2", maxWidth: 880 })}
      <div style="display:flex;flex-direction:column;gap:28px;">${paras}</div>`, { width: 904 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}${ptImg(s.image, { style: "flex:0 0 904px;" })}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
