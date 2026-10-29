// Template: pitch/grid-05 — a heading and a note beside one large donut chart with its value in
// the middle.
// Source Figma frame 110:37051.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptTocItem, ptMetricCard, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-05", slide: 271, figmaNode: "110:37051",
  family: "pitch", role: "chart", shape: "split", theme: "light", chrome: false,
  use: "A heading with a note, beside a large donut chart showing one percentage.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 1, stats: 1, icons: 0 },
  description: "pitch/grid-05 — heading + note, one big donut percentage.",
  intent: {
    bestFor: ["one headline figure that is a share of something: 70% of users, 3 in 4 customers"],
    holds: "an eyebrow, a headline of up to about 100 characters, a paragraph of up to about 240 characters, and one percentage",
    itemChars: 100,
    avoid: ["several figures (use pitch/grid-02)", "values that are not percentages"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string",
    value: "number — the percentage, 0–100", label: "string — shown in the middle, e.g. 70.6%",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Problem", title: "Highlight key statistics that strengthen your problem description and demonstrate its impact.",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.", value: 70.6, label: "70.6%",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "11" },
    footer: PT_FOOTER,
  },
  render(s) {
    const C = 2 * Math.PI * 370.6;
    const p = Math.max(0, Math.min(100, Number(s.value) || 0)) / 100;
    const donut = `
      <div class="v2f-pt-donut">
        <svg viewBox="0 0 872 872" aria-hidden="true">
          <defs><linearGradient id="ptd" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#b1b3b9"/><stop offset="1" stop-color="#d8dae2"/></linearGradient></defs>
          <circle cx="436" cy="436" r="370.6" fill="none" stroke="url(#ptd)" stroke-width="130.8"/>
          <circle cx="436" cy="436" r="370.6" fill="none" stroke="#fff" stroke-width="130.8" stroke-dasharray="${(p * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 436 436)"/>
        </svg>
        <div class="big">${esc(s.label ?? "")}</div>
      </div>`;
    const left = ptCol(s.meta, `
      ${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}
      ${s.body ? `<p class="v2f-pt-body" style="margin-top:auto;">${esc(s.body)}</p>` : ""}`, { width: 597, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:64px;">${left}<div class="v2f-pt-stage">${donut}</div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
