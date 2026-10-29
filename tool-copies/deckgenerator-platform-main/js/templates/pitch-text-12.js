// Template: pitch/text-12 — a six-step timeline with a photo above each date.
// Source Figma frame 110:37278.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/text-12", slide: 292, figmaNode: "110:37278",
  family: "pitch", role: "timeline", shape: "row", theme: "light", chrome: false,
  use: "A heading over six photos, each above a dated milestone on one timeline.",
  media: ["photo"], capacity: { items: 6, min: 4, max: 6 },
  slots: { images: 6, titles: 1, subtitles: 0, body: 6, stats: 0, icons: 0 },
  description: "pitch/text-12 — heading + six photos over a dated timeline.",
  intent: {
    bestFor: ["a roadmap or go-to-market plan where each stage has a picture", "six milestones of a product's history or plan"],
    holds: "an eyebrow, a title, and 4–6 milestones of a date (up to 8 characters), a name (up to 28 characters), a line of up to about 50 characters and a photo",
    itemChars: 50,
    avoid: ["more than six milestones", "milestones without pictures (use pitch/grid-15)"],
    feel: "visual",
    needs: ["a photo per milestone"],
  },
  schema: {
    caption: "string", title: "string", steps: "array of 4–6 { date, title, body, image }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market", title: "Go-to-market",
    steps: ["2025", "2026", "2027", "2028", "2029", "2030"].map((date, i) => ({ date, title: ["Minimum viable product", "Beta release", "Alpha release", "User growth", "User growth", "User growth"][i], body: "Lorem ipsum dolor sit\namet, consectetur\nadipiscing elit.", image: ptPhoto(i + 2) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "32" },
    footer: PT_FOOTER,
  },
  render(s) {
    const st = (s.steps || []).slice(0, 6);
    const imgs = st.map((p) => `<div class="ph">${p.image ? `<img src="${esc(p.image)}" alt="">` : ""}</div>`).join("");
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
        <div class="v2f-pt-t12 reveal"><div class="imgs">${imgs}</div><div class="v2f-pt-tl t12">${items}</div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
