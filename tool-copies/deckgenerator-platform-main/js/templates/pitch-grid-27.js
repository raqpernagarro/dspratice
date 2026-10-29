// Template: pitch/grid-27 — a step plan: a heading over five columns along one line, the first
// naming what is being raised.
// Source Figma frame 110:37432.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-27", slide: 305, figmaNode: "110:37432",
  family: "pitch", role: "timeline", shape: "row", theme: "light", chrome: false,
  use: "A heading over a five-column step plan along one line: a label first, then four dated steps.",
  media: [], capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 5, stats: 0, icons: 0 },
  description: "pitch/grid-27 — heading + five-column step plan.",
  intent: {
    bestFor: ["the steps the funding will pay for, in order", "a short plan with a first column that names the goal"],
    holds: "an eyebrow, a title, and 3–5 columns of a heading (up to 10 characters, may be empty), a name (up to 20 characters) and a line of up to about 60 characters",
    itemChars: 60,
    avoid: ["more than five steps", "steps with photos (use pitch/text-12)"],
    feel: "airy",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", steps: "array of 3–5 { title, name, body } — title may be empty",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market", title: "Go-to-market",
    steps: [
      { title: "", name: "Funding", body: "" },
      { title: "Step 1", name: "Month", body: "Lorem ipsum dolor sit\namet, consectetur adipiscing elit." },
      { title: "Step 2", name: "Month", body: "Lorem ipsum dolor sit\namet, consectetur adipiscing elit." },
      { title: "Step 3", name: "Month", body: "Lorem ipsum dolor sit\namet, consectetur adipiscing elit." },
      { title: "Step 4", name: "Month", body: "Lorem ipsum dolor sit\namet, consectetur adipiscing elit." },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "45" },
    footer: PT_FOOTER,
  },
  render(s) {
    const st = (s.steps || []).slice(0, 5);
    const items = st.map((p, i) => `
      <div class="it">
        <p class="y">${esc(p.title ?? "")}</p>
        <div class="ln">${i === 0 ? '<span class="tick"></span>' : '<span class="bul"></span>'}<span class="bar${i === st.length - 1 ? " end" : ""}"></span></div>
        <div class="d"><p class="a">${esc(p.name ?? "")}</p><p class="c">${esc(p.body ?? "")}</p></div>
      </div>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}
        <div class="v2f-pt-tl reveal">${items}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
