// Template: pitch/grid-22 — the roadmap: a heading beside three tall phase cards, light to
// dark, each with its goals and dated tags. grid-23, 24 and 25 in Figma are
// this slide with one phase in focus and are not built separately.
// Source Figma frame 110:37386.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-22", slide: 300, figmaNode: "110:37386",
  family: "pitch", role: "timeline", shape: "split", theme: "light", chrome: false,
  use: "A heading beside three tall phase cards, light grey to black, each with a subtitle, a description, goals and tags.",
  media: [], capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 0, titles: 4, subtitles: 3, body: 3, stats: 0, icons: 0 },
  description: "pitch/grid-22 — heading + three roadmap phase cards.",
  intent: {
    bestFor: ["the product or company roadmap in three phases"],
    holds: "an eyebrow, a title, and 2–3 phases of a name, a subtitle, a sentence of up to about 130 characters, up to three goals and up to five tags",
    itemChars: 130,
    avoid: ["more than three phases", "phases with detailed plans"],
    feel: "dense",
    needs: [],
  },
  schema: {
    caption: "string", title: "string",
    phases: "array of 2–3 { title, subtitle, body, bullets: string[], tags: string[] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Next step", title: "Roadmap",
    phases: [1, 2, 3].map((n) => ({ title: "Phase " + n, subtitle: "Subtitle", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", bullets: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"], tags: n === 1 ? ["Today", "Today", "Today", "Today", "Today"] : [] })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "40" },
    footer: PT_FOOTER,
  },
  render(s) {
    const tones = ["t25", "t50", "t100"];
    const ph = (s.phases || []).slice(0, 3).map((p, i) => `
      <div class="v2f-pt-phase ${tones[i]}">
        <div class="h"><p class="a">${esc(p.title ?? "")}</p><p class="s">${esc(p.subtitle ?? "")}</p><p class="b">${esc(p.body ?? "")}${(p.bullets || []).length ? "\n\n" + p.bullets.map((b) => "> " + esc(b)).join("\n") : ""}</p></div>
        ${(p.tags || []).length ? `<div class="pills">${p.tags.slice(0, 5).map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : "<span></span>"}
      </div>`).join("");
    const left = ptCol(s.meta, ptHead({ caption: s.caption, title: s.title }, { size: "h2" }), { width: 589, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}<div class="v2f-pt-phases">${ph}</div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
