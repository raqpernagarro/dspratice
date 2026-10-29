// Template: pitch/grid-18 — a vision with a constellation of seven logos on a tinted stage, the
// middle one highlighted.
// Source Figma frame 110:37322.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-18", slide: 295, figmaNode: "110:37322",
  family: "pitch", role: "logos", shape: "split", theme: "light", chrome: false,
  use: "A vision statement and a note beside seven logo circles, the middle one in focus.",
  media: ["logo"], capacity: { items: 7, min: 3, max: 7 },
  slots: { images: 7, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "pitch/grid-18 — vision statement + seven-logo constellation.",
  intent: {
    bestFor: ["partners, customers or the ecosystem around the product: your own logo in the middle, the others around it"],
    holds: "an eyebrow, a vision of up to about 80 characters, a note of up to about 250 characters, and up to seven logos (the fourth is the highlighted centre)",
    itemChars: 80,
    avoid: ["more than seven logos (use a logo wall)", "logos without transparent backgrounds"],
    feel: "visual",
    needs: ["logos"],
  },
  schema: {
    caption: "string", title: "string — the vision", body: "string",
    logos: "array of up to 7 { image, label } — the 4th is highlighted; label shows when there is no image",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Vision", title: "To become an essential component of the XXX industry", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ipsum purus, feugiat vel dolor sed, malesuada lobortis urna. Proin a lectus ut nibh euismod egestas. Aenean non tincidunt ex, a dapibus sem. Curabitur efficitur accumsan mollis. Donec in auctor ligula, vitae commodo turpis.",
    logos: Array.from({ length: 7 }, () => ({ label: "Logo" })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "35" },
    footer: PT_FOOTER,
  },
  render(s) {
    const lg = (s.logos || []).slice(0, 7);
    const dot = (l = {}, hi) => `<div class="lg${hi ? " hi" : ""}">${l.image ? `<img src="${esc(l.image)}" alt="">` : esc(l.label ?? "")}</div>`;
    const stage = `<div class="v2f-pt-logos"><div class="col">${dot(lg[0])}${dot(lg[1])}</div><div class="col">${dot(lg[2])}${dot(lg[3], true)}${dot(lg[4])}</div><div class="col">${dot(lg[5])}${dot(lg[6])}</div></div>`;
    const left = ptCol(s.meta, `${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}${s.body ? `<p class="v2f-pt-body" style="margin-top:auto;">${esc(s.body)}</p>` : ""}`, { width: 589, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}<div class="v2f-pt-stage">${stage}</div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
