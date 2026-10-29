// Template: marketing/grid-08 — a small page header, five columns each with a name, a short label and a photo, and a paragraph at the bottom-left.
// Source Figma frame 110:30694.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-08", slide: 325, figmaNode: "110:30694",
  family: "marketing", role: "gallery", shape: "row", theme: "light", chrome: false,
  use: "Five audience profiles side by side, each with a name and a photo",
  media: ["photo"], capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 5, titles: 6, subtitles: 5, body: 1, stats: 0, icons: 0 },
  description: "marketing/grid-08 — a small page header, five columns each with a name, a short label and a photo, and a paragraph at the bottom-left.",
  intent: {
    bestFor: ["introducing the audience segments (for example generations) with a picture of each"],
    holds: "a title and subtitle, three to five segments with a name of up to about 14 characters, a label and a photo, and a paragraph of up to about 300 characters",
    itemChars: 14,
    avoid: ["more than five segments", "no photos"],
    feel: "visual",
    needs: ["5 photos"],
  },
  schema: {
    title: "string", subtitle: "string", profiles: "array of up to 5 {name, label, image}", body: "string — paragraph, line breaks kept",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Overview", subtitle: "Audience",
    profiles: ["Gen Alpha", "Gen Z", "Millennials", "Gen X", "Boomers"].map((name, i) => ({ name, label: "Lorem ipsum", image: mkPhoto(i) })),
    body: "Lorem ipsum dolor sit amet, consectetur\nadipiscing elit. Proin ipsum purus, feugiat vel dolor\nsed, malesuada lobortis urna. Proin a lectus ut\nnibh euismod egestas. Aenean non tincidunt ex, a\ndapibus sem. Curabitur efficitur accumsan mollis.\nDonec in auctor ligula, vitae commodo turpis.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "18" },
    footer: MK_FOOTER,
  },
  render(s) {
    const pr = (s.profiles || []).slice(0, 5);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${mkSmallHead({ title: s.title, subtitle: s.subtitle }, { mid: true })}
        <div class="v2f-mk-profiles reveal">${pr.map((p) => `
          <div class="p"><div class="d"><p class="n">${esc(p.name ?? "")}</p><p class="l">${esc(p.label ?? "")}</p></div>${mkImg(p.image, { style: "flex:0 0 355px;height:355px;" })}</div>`).join("")}</div>
        ${s.body ? `<p class="v2f-mk-foot reveal">${esc(s.body)}</p>` : ""}
        ${mkFooter(s.footer)}
      </div>`;
  },
};
