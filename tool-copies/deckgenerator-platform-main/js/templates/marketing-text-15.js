// Template: marketing/text-15 — an eyebrow, a title and a subtitle, then two tinted cards — Do with a green tick and Don't with a red cross — each with a list of '>' statements; `dim` fades one of them.
// Source Figma frame 110:30940.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-15", slide: 338, figmaNode: "110:30940",
  family: "marketing", role: "cards", shape: "split", theme: "light", chrome: false,
  use: "Do and don't: two large cards with a tick and a cross, optionally one dimmed",
  media: [], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 0, titles: 4, subtitles: 1, body: 2, stats: 0, icons: 2 },
  description: "marketing/text-15 — an eyebrow, a title and a subtitle, then two tinted cards — Do with a green tick and Don't with a red cross — each with a list of '>' statements; `dim` fades one of them.",
  intent: {
    bestFor: ["content or brand guidelines as do and don't lists", "walking through do first, then don't (repeat with `dim`)"],
    holds: "an eyebrow, a title, a subtitle, and two lists of three to five statements of up to about 60 characters",
    itemChars: 60,
    avoid: ["more than five statements per card", "long statements"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", subtitle: "string", dos: "string[]", donts: "string[]", dim: "\"do\" | \"dont\" | omitted — the card to fade",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Content Strategy", title: "Content", subtitle: "Do’s and don’ts",
    dos: Array(5).fill("Lorem ipsum dolor sit amet, consectetur adipiscing elit."), donts: Array(3).fill("Lorem ipsum dolor sit amet, consectetur adipiscing elit."),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "31" },
    footer: MK_FOOTER,
  },
  render(s) {
    const TICK = `<svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true"><circle cx="15" cy="15" r="15" fill="#4FA13B"/><path d="M8.5 15.5l4.3 4.3 8.7-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const CROSS = `<svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true"><circle cx="15" cy="15" r="15" fill="#D8352A"/><path d="M10 10l10 10M20 10L10 20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;
    const card = (ic, label, list, dim) => `<div class="v2f-mk-dd${dim ? " dim" : ""}"><div class="ti">${ic}<p>${label}</p></div><div class="ls">${(list || []).slice(0, 5).map((t) => `<p>&gt; ${esc(t)}</p>`).join("")}</div></div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-mk-h144 reveal"><div class="v2f-mk-ph center"><div class="hd">
          ${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<div><p class="v2f-cs-h2">${esc(s.title ?? "")}</p>${s.subtitle ? `<p class="v2f-cs-h5 v2f-cs-muted">${esc(s.subtitle)}</p>` : ""}</div></div></div></div>
        <div class="v2f-mk-2dd reveal">${card(TICK, "Do", s.dos, s.dim === "do")}${card(CROSS, "Don’t", s.donts, s.dim === "dont")}</div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
