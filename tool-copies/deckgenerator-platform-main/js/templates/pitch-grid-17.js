// Template: pitch/grid-17 — a heading beside a vertical timeline of up to six stages, each
// with a name and a line of detail.
// Source Figma frame 110:37309.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-17", slide: 294, figmaNode: "110:37309",
  family: "pitch", role: "timeline", shape: "split", theme: "light", chrome: false,
  use: "A heading beside a vertical timeline of up to six stages on a tinted stage.",
  media: [], capacity: { items: 6, min: 3, max: 6 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 6, stats: 0, icons: 0 },
  description: "pitch/grid-17 — heading + vertical six-stage timeline.",
  intent: {
    bestFor: ["the go-to-market or product plan as a sequence of stages: launch, onboarding, scale…"],
    holds: "an eyebrow, a title, and 3–6 stages of a name (up to 14 characters) and a sentence of up to about 120 characters",
    itemChars: 120,
    avoid: ["dates (use pitch/grid-15)", "more than six stages"],
    feel: "airy",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string — optional note at the bottom of the left column", rows: "array of 3–6 { label, text }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market", title: "Go-to-market",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ipsum purus, feugiat vel dolor sed, malesuada lobortis urna. Proin a lectus ut nibh euismod egestas. Aenean non tincidunt ex, a dapibus sem. Curabitur efficitur accumsan mollis. Donec in auctor ligula, vitae commodo turpis.",
    rows: ["Launch", "Onboarding", "Scale", "Innovate", "Community", "Lorem Ipsum"].map((label) => ({ label, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "34" },
    footer: PT_FOOTER,
  },
  render(s) {
    const rows = (s.rows || []).slice(0, 6);
    const list = `<div class="v2f-pt-vt">${rows.map((r, i) => `
      <div class="rw"><p class="lb">${esc(r.label ?? "")}</p><div class="ax">${i === 0 ? '<span class="tick"></span>' : '<span class="bul"></span>'}<span class="ln${i === rows.length - 1 && !false ? " end" : ""}"></span></div><p class="tx">${esc(r.text ?? "")}</p></div>`).join("")}</div>`;
    const left = ptCol(s.meta, `${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}${s.body ? `<p class="v2f-pt-body" style="margin-top:auto;">${esc(s.body)}</p>` : ""}`, { width: 589, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}<div class="v2f-pt-stage">${list}</div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
