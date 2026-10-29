// Template: pitch/grid-15 — a go-to-market timeline: up to four dated milestones along one line.
// Source Figma frame 110:37270.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-15", slide: 291, figmaNode: "110:37270",
  family: "pitch", role: "timeline", shape: "row", theme: "light", chrome: false,
  use: "A heading over a horizontal timeline of up to four dated milestones.",
  media: [], capacity: { items: 4, min: 3, max: 4 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 4, stats: 0, icons: 0 },
  description: "pitch/grid-15 — heading + four-step dated timeline.",
  intent: {
    bestFor: ["the go-to-market plan or the product roadmap by year", "a handful of milestones in order"],
    holds: "an eyebrow, a title, and 3–4 milestones of a date (up to 12 characters), a name (up to 28 characters) and up to about 60 characters of detail",
    itemChars: 60,
    avoid: ["more than four milestones (use pitch/text-12)", "milestones with photos"],
    feel: "airy",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", steps: "array of 3–4 { date, title, body }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market", title: "Go-to-market",
    steps: [
      { date: "2025", title: "Minimum viable product", body: "Lorem ipsum dolor sit\namet, consectetur\nadipiscing elit." },
      { date: "2026", title: "Beta release", body: "Lorem ipsum dolor sit\namet, consectetur\nadipiscing elit." },
      { date: "2027", title: "Alpha release", body: "Lorem ipsum dolor sit\namet, consectetur\nadipiscing elit." },
      { date: "2028", title: "User growth", body: "Lorem ipsum dolor sit\namet, consectetur\nadipiscing elit." },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "31" },
    footer: PT_FOOTER,
  },
  render(s) {
    const st = (s.steps || []).slice(0, 4);
    const items = st.map((p, i) => `
      <div class="it">
        <p class="y">${esc(p.date ?? "")}</p>
        <div class="ln">${i === 0 ? '<span class="tick"></span>' : '<span class="bul"></span>'}<span class="bar${i === st.length - 1 ? " end" : ""}"></span></div>
        <div class="d"><p class="a">${esc(p.title ?? "")}</p><p class="c">${esc(p.body ?? "")}</p></div>
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
