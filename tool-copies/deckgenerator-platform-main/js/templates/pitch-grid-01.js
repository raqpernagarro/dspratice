// Template: pitch/grid-01 — a table of contents: a heading and note on the left, the
// numbered sections on a tinted panel at the right.
// Source Figma frame 110:36995.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptTocItem, ptMetricCard, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-01", slide: 263, figmaNode: "110:36995",
  family: "pitch", role: "toc", shape: "split", theme: "light", chrome: false,
  use: "A heading and a short note beside a tinted panel listing up to six numbered sections.",
  media: [], capacity: { items: 6, min: 3, max: 6 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0, list: 6 },
  description: "pitch/grid-01 — left heading + note, right panel of six numbered sections.",
  intent: {
    bestFor: ["the agenda of a pitch deck, with a sentence of context", "the sections of a deck when the left column can carry a short introduction"],
    holds: "a title, a subtitle, a paragraph of up to about 240 characters, and 3–6 section names of up to about 28 characters",
    itemChars: 28,
    avoid: ["more than six sections (use pitch/index)", "anything that is not an outline"],
    feel: "airy",
    needs: [],
  },
  schema: {
    title: "string", subtitle: "string", body: "string — the note at the bottom of the left column",
    items: "array of up to 6 { number, label }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Table of contents", subtitle: "Subtitle", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    items: ["Introduce the problem", "Present your solution", "Highlight your product", "Business", "Target your market", "Outline the next steps"].map((label, i) => ({ number: String(i + 1).padStart(2, "0"), label })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "03" },
    footer: PT_FOOTER,
  },
  render(s) {
    const items = (s.items || []).slice(0, 6).map(ptTocItem).join("");
    const left = ptCol(s.meta, `
      ${ptHead({ title: s.title, subtitle: s.subtitle }, { size: "h4" })}
      ${s.body ? `<p class="v2f-pt-body" style="margin-top:auto;">${esc(s.body)}</p>` : ""}`, { width: 600 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:40px;">${left}<div class="v2f-pt-tocbox"><div class="v2f-pt-toclist" style="gap:0;">${items}</div></div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
