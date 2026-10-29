// Template: main/team-03 — "Team Structure": two tinted rows of Role Badges (person disc +
// role) in a right-aligned 4×2 grid; the lower row led by the vertical Nagarro logo.
// Source Figma frame 342:40690. Classes are .t3-* — the app CSS styles bare
// .panel / .chip, which broke this slide inside the Templates page.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { NAGARRO_LOGO_VERTICAL, ROLE_ICON } from "../logo-vertical.js";

const ROW = () => Array.from({ length: 8 }, () => ({ role: "Role /position" }));

export default {
  name: "main/team-03", slide: -6, figmaNode: "342:40690",
  family: "main", role: "team", shape: "diagram", theme: "light", chrome: false,
  use: "A team-structure diagram — two grey panels of role chips, the lower one led by the Nagarro logo.",
  media: [], capacity: { items: 16, min: 4, max: 20 },
  slots: { images: 0, titles: 1, body: 16, stats: 0, icons: 16 },
  description: "main/team-03 — heading + 2 tinted rows of role badges (4×2 each), the lower one led by the Nagarro logo.",
  intent: { bestFor: ["how the delivery team is structured: client roles beside the Nagarro team"], holds: "two panels of role names, 4–20 roles", itemChars: 30, avoid: ["named people", "risks or tasks"], feel: "visual", needs: [] },
  schema: {
    title: "string — heading",
    panels: "array of { logo?: true (Nagarro) | image-src (partner logo), chips:[{ role }] } — up to 8 chips per row",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Team Structure",
    // top row = client/partner (pass its logo src to show it), bottom row = Nagarro
    panels: [{ chips: ROW() }, { logo: true, chips: ROW() }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const panels = s.panels || [{ chips: ROW() }, { logo: true, chips: ROW() }];
    const badge = (c) => `<div class="t3-badge"><span class="t3-ic">${ROLE_ICON}</span><span class="t3-rl">${esc(c.role)}</span></div>`;
    const lead = (logo) => logo === true
      ? `<span class="t3-nag">${NAGARRO_LOGO_VERTICAL}</span>`
      : logo ? `<img class="t3-climg" src="${esc(logo)}" alt="">` : "";
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-team3 reveal">
          ${s.title ? `<p class="t3-ttl">${esc(s.title)}</p>` : ""}
          ${panels.slice(0, 2).map((p) => `<div class="t3-row">
            ${lead(p.logo)}
            <div class="t3-grid">${(p.chips || []).slice(0, 8).map(badge).join("")}</div>
          </div>`).join("")}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
