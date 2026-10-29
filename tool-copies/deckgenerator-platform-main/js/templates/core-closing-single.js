// Template: core/closing-single — closing "Thank you" slide with contact block.
// Source Figma frame 109:5558.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "core/closing-single",
  slide: 64,
  figmaNode: "109:5558",
  family: "core",
  role: "closing",
  shape: "single",
  theme: "light",
  chrome: false,
  use: "The closing slide: a large thank-you headline and contact details (email, website).",
  media: [],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "core/closing-single — thank-you headline + contact block.",
  schema: {
    title: "string — closing headline (e.g. Thank you!)",
    contactLabel: "string — small label (e.g. Contact)",
    email: "string", website: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Thank you!", contactLabel: "Contact",
    email: "email@yourcompany.com", website: "yourcompany.com",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "143" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <p class="v2f-closing-title reveal">${esc(s.title ?? "Thank you!")}</p>
        <div class="v2f-closing-contact reveal">
          ${s.contactLabel ? `<p class="v2f-closing-label">${esc(s.contactLabel)}</p>` : ""}
          <div class="v2f-closing-lines">
            ${s.email ? `<p>${esc(s.email)}</p>` : ""}
            ${s.website ? `<p>${esc(s.website)}</p>` : ""}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
