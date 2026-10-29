// Template: marketing/text-02 — an eyebrow and a 100px statement at the left, with two short paragraphs bottom-right.
// Source Figma frame 110:30495.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkTocTile, mkTocRow, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-02", slide: 312, figmaNode: "110:30495",
  family: "marketing", role: "statement", shape: "split", theme: "light", chrome: false,
  use: "Very large statement at the left with a short note at the bottom-right",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 2, stats: 0, icons: 0 },
  description: "marketing/text-02 — an eyebrow and a 100px statement at the left, with two short paragraphs bottom-right.",
  intent: {
    bestFor: ["opening a chapter by stating the project's starting point", "one strong sentence with a short note"],
    holds: "an eyebrow of 1–2 words, a statement of up to about 90 characters and two short paragraphs",
    itemChars: 90,
    avoid: ["long statements", "lists or figures"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", title: "string — the statement", body: "string — paragraphs separated by a blank line",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Context", title: "Describe the project’s starting point and provide essential context",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam eiusmod tempor incididunt ut labore et dolor.\n\nEiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "05" },
    footer: MK_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal" style="gap:24px;">
          <div style="flex:0 0 1220px;">${mkHead({ caption: s.caption, title: s.title }, { size: "h1" })}</div>
          <div class="v2f-mk-note"><p>${esc(s.body ?? "")}</p></div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
