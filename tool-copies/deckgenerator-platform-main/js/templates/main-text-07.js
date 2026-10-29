// Template: main/text-07 — a co-brand partnership slide: a "Partner + nagarro" lockup
// centred on a dark petrol/teal gradient, with a tagline. Source Figma frame 442:29728.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { NAGARRO_LOGO } from "../logo.js";

export default {
  name: "main/text-07", slide: -36, figmaNode: "442:29728",
  family: "main", role: "statement", shape: "single", theme: "dark", chrome: false,
  use: "A co-brand partnership slide — a partner wordmark + nagarro lockup on a dark gradient, with a tagline.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "main/text-07 — 'Partner + nagarro' lockup + tagline on a petrol/teal gradient.",
  schema: {
    partner: "string — partner name (serif wordmark)", partnerLogo: "optional logo URL",
    tagline: "string — the partnership tagline",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    partner: "Hilton", tagline: "A Partnership to Stay.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const partner = s.partnerLogo
      ? `<img class="v2f-mn-tp7-plogo" src="${esc(s.partnerLogo)}" alt="${esc(s.partner || "")}">`
      : `<span class="v2f-mn-tp7-pname">${esc(s.partner ?? "")}</span>`;
    return `
      <div class="v2f-root v2f-dark v2f-mn-tp7-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tp7 reveal">
          <div class="lockup">
            ${partner}
            <span class="plus">+</span>
            <span class="v2f-mn-tp7-nag">${NAGARRO_LOGO}</span>
          </div>
          <span class="rule"></span>
          ${s.tagline ? `<p class="tagline">${esc(s.tagline)}</p>` : ""}
        </div>
      </div>`;
  },
};
