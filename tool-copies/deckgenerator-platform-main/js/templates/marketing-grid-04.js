// Template: marketing/grid-04 — a small page header over one tinted panel: a 60px statement in the middle and two short notes above and two below.
// Source Figma frame 110:30527.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-04", slide: 316, figmaNode: "110:30527",
  family: "marketing", role: "statement", shape: "grid", theme: "light", chrome: false,
  use: "A large statement in the middle of a panel, with four short notes around it",
  media: [], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 0, titles: 6, subtitles: 1, body: 4, stats: 0, icons: 0 },
  description: "marketing/grid-04 — a small page header over one tinted panel: a 60px statement in the middle and two short notes above and two below.",
  intent: {
    bestFor: ["framing the big opportunity with four supporting dimensions (context, culture, consumer, company)"],
    holds: "a title and subtitle, a statement of up to about 60 characters with a one-word label, and four notes with a heading of 1–2 words and a sentence of up to about 70 characters",
    itemChars: 70,
    avoid: ["more or fewer than four notes", "long statements"],
    feel: "dense",
    needs: [],
  },
  schema: {
    title: "string", subtitle: "string", label: "string — eyebrow of the statement", statement: "string", corners: "array of 4 {title, body} — top-left, top-right, bottom-left, bottom-right",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Opportunity", subtitle: "Market", label: "Opportunity", statement: "Describe the big opportunity\nyour project unlocks",
    corners: ["Context", "Culture", "Consumer", "Company"].map((title) => ({ title, body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "09" },
    footer: MK_FOOTER,
  },
  render(s) {
    const n = s.corners || [];
    const note = (x = {}) => `<div class="v2f-mk-note4"><p class="t">${esc(x.title ?? "")}</p><p class="b">${esc(x.body ?? "")}</p></div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkSmallHead({ title: s.title, subtitle: s.subtitle })}
        <div class="v2f-mk-cross reveal">
          <div class="r">${note(n[0])}${note(n[1])}</div>
          <div class="r mid"><div class="v2f-mk-cmid">
            ${s.label ? `<p class="l">${esc(s.label)}</p>` : ""}
            <p class="st">${esc(s.statement ?? "")}</p></div></div>
          <div class="r">${note(n[2])}${note(n[3])}</div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
