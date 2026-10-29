// Template: social/grid-09 — an eyebrow, title and two paragraphs in a left column; at the right the same post adapted for Instagram, Facebook and LinkedIn, each phone labelled underneath.
// Source Figma frame 110:22500.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/grid-09", slide: 374, figmaNode: "110:22500",
  family: "social", role: "showcase", shape: "split", theme: "light", chrome: false,
  use: "One post adapted for Instagram, Facebook and LinkedIn",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 4, subtitles: 1, body: 4, stats: 0, icons: 0 },
  description: "social/grid-09 — an eyebrow, title and two paragraphs in a left column; at the right the same post adapted for Instagram, Facebook and LinkedIn, each phone labelled underneath.",
  intent: {
    bestFor: ["showing how one piece of content is adapted per network"],
    holds: "an eyebrow, a title, a paragraph of up to about 450 characters and three images (Instagram, Facebook, LinkedIn) with a label and a line each",
    itemChars: 450,
    avoid: ["networks other than these three", "long paragraphs"],
    feel: "visual",
    needs: ["3 images"],
  },
  schema: {
    eyebrow: "string", title: "string", body: "string — blank lines split paragraphs",
    posts: "array of 3 {image, label, text} — Instagram, Facebook, LinkedIn in that order; Facebook and LinkedIn also take caption (the post text) and headline (the link card)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    eyebrow: "Adaptations", title: "Facebook & LinkedIn", body: `${SO_LOREM}\n\n${SO_LOREM}`,
    posts: [["Instagram", 1], ["Facebook", 2], ["LinkedIn", 3]].map(([label, i]) => ({ image: soPhoto(i), label, text: "Post" })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "15" },
    footer: SO_FOOTER,
  },
  render(s) {
    const p = s.posts || [];
    const kinds = [["post", 0.8911], ["facebook", 0.8182], ["linkedin", 0.8182]];
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">
          <div class="v2f-so-lcol" style="flex-basis:600px;">${topBar(s.meta, { logoOnly: true })}
            <div class="v2f-so-head bottom"><div class="hd"><p class="e">${esc(s.eyebrow ?? "")}</p><p class="t">${esc(s.title ?? "")}</p></div><p class="par v2f-so-par20">${esc(s.body ?? "")}</p></div></div>
          <div class="v2f-so-adapt">${kinds.map(([k, sc], i) => `<div class="g">${soPhone(k, p[i]?.image, { scale: sc, ...(p[i]?.caption ? { caption: p[i].caption } : {}), ...(p[i]?.headline ? { headline: p[i].headline } : {}) })}
            <div class="tx"><p>${esc(p[i]?.label ?? "")}</p><p class="m">${esc(p[i]?.text ?? "")}</p></div></div>`).join("")}</div>
        </div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
