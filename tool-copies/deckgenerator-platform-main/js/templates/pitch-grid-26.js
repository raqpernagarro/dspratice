// Template: pitch/grid-26 — the ask: a heading and note beside a ladder of funding tranches
// that adds up to the total raise.
// Source Figma frame 110:37418.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-26", slide: 304, figmaNode: "110:37418",
  family: "pitch", role: "timeline", shape: "split", theme: "light", chrome: false,
  use: "A heading and a note beside a ladder of up to six funding tranches adding up to a total.",
  media: [], capacity: { items: 6, min: 3, max: 6 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 7, stats: 7, icons: 0 },
  description: "pitch/grid-26 — heading + note, funding ladder to a total.",
  intent: {
    bestFor: ["the ask: how much is raised and what each tranche pays for"],
    holds: "an eyebrow, a title, a note of up to about 220 characters, 3–6 tranches of an amount (up to 8 characters) and a sentence of up to about 120 characters, and the total",
    itemChars: 120,
    avoid: ["a plan with dates (use pitch/grid-15)", "more than six tranches"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string", rows: "array of 3–6 { label, text }", total: "string — e.g. = 10M",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Next step", title: "The ask", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ipsum purus, feugiat vel dolor sed, malesuada lobortis urna. Proin a lectus ut nibh euismod egestas. Aenean non tincidunt ex, a dapibus sem. Curabitur efficitur accumsan mollis. Donec in auctor ligula, vitae commodo turpis.",
    rows: Array.from({ length: 6 }, () => ({ label: "500K", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed\ndo eiusmod tempor incididunt ut labore et dolore magna\naliqua." })),
    total: "= 10M",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "44" },
    footer: PT_FOOTER,
  },
  render(s) {
    const rows = (s.rows || []).slice(0, 6);
    const list = `<div class="v2f-pt-vt ask">${rows.map((r, i) => `
      <div class="rw"><p class="lb dim">${esc(r.label ?? "")}</p><div class="ax">${i === 0 ? '<span class="tick"></span>' : '<span class="bul"></span>'}<span class="ln${i === rows.length - 1 && !!!s.total ? " end" : ""}"></span></div><p class="tx">${esc(r.text ?? "")}</p></div>`).join("")}${s.total ? `<div class="rw last"><p class="lb">${esc(s.total)}</p><div class="ax"><span class="ln end" style="min-height:28px"></span></div><p class="tx"></p></div>` : ""}</div>`;
    const left = ptCol(s.meta, `${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}${s.body ? `<p class="v2f-pt-body" style="margin-top:auto;">${esc(s.body)}</p>` : ""}`, { width: 557, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">${left}<div class="v2f-pt-stage">${list}</div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
