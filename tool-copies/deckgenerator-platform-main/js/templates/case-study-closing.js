// Template: case-study/closing — the contact slide that ends a case study: email
// and website as a large heading, the office address at the bottom-left.
// Source Figma frame 110:40366.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { csFooter, CS_FOOTER } from "../case-study-blocks.js";

export default {
  name: "case-study/closing", slide: 261, figmaNode: "110:40366",
  family: "case-study", role: "closing", shape: "single", theme: "light", chrome: false,
  use: "The closing contact slide: email and website as a large heading, address lines at the bottom.",
  media: [], capacity: { items: 4, min: 0, max: 4 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "case-study/closing — eyebrow + email/website heading, address lines bottom-left.",
  intent: {
    bestFor: ["the last slide of a case study or proposal: how to get in touch"],
    holds: "an eyebrow, up to two contact lines (email, website), and up to four short address lines",
    itemChars: 40,
    avoid: ["anything other than the final slide", "a thank-you sign-off with no contact details"],
    feel: "statement",
    needs: [],
  },
  schema: {
    caption: "string", contacts: "array of 1–2 strings — email, website",
    address: "array of up to 4 strings — office, street, city, country",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Contact",
    contacts: ["email@yourcompany.com", "yourcompany.com"],
    address: ["Office", "Street", "City", "Country"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "26" },
    footer: CS_FOOTER,
  },
  render(s) {
    const contacts = (s.contacts || []).slice(0, 2).map((c) => `<p class="v2f-cs-h2">${esc(c)}</p>`).join("");
    const address = (s.address || []).slice(0, 4).map((l) => `<p>${esc(l)}</p>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-col reveal">
          <div class="v2f-cs-head">${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<div>${contacts}</div></div>
          ${address ? `<div class="v2f-cs-lines lg" style="margin-top:auto;">${address}</div>` : ""}
        </div>
        ${csFooter(s.footer)}
      </div>`;
  },
};
