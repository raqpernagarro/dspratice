// Template: pitch/closing — the closing: a huge thank-you and the contact details.
// Source Figma frame 110:37441.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/closing", slide: 306, figmaNode: "110:37441",
  family: "pitch", role: "closing", shape: "single", theme: "light", chrome: false,
  use: "The closing slide: a thank-you in very large type and the contact email and website.",
  media: [], capacity: { items: 3, min: 1, max: 3 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 2, stats: 0, icons: 0 },
  description: "pitch/closing — thank-you + contact lines.",
  intent: {
    bestFor: ["the last slide of a pitch: thank you and where to reach the team"],
    holds: "a closing line of one to three words and up to two contact lines of up to about 30 characters",
    itemChars: 30,
    avoid: ["anything other than the final slide", "a call to action in sentences"],
    feel: "statement",
    needs: [],
  },
  schema: {
    title: "string — e.g. Thank you", contacts: "array of 1–2 strings — email, website", caption: "string — label above the contacts",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Thank you", caption: "Contact", contacts: ["email@yourcompany.com", "yourcompany.com"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "46" },
    footer: PT_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-pt-closing reveal">
          <div class="mid"><p class="v2f-cs-h1" style="margin:0;">${esc(s.title ?? "")}</p></div>
          <div class="by">${s.caption ? `<p class="k">${esc(s.caption)}</p>` : ""}${(s.contacts || []).slice(0, 2).map((c) => `<p class="v">${esc(c)}</p>`).join("")}</div>
        </div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
