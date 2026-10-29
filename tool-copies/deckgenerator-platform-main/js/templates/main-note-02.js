// Template: main/note-02 — "A Note From Us": a heading on the left and a single wide
// column of letter text, both vertically centred. Source Figma frame 342:37342.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const NOTE_BODY = [
  "First and foremost, thank you for inviting us to submit a proposal for the UX/UI Design, Prototyping & Validation of the ______________ Project.",
  "At Nagarro, we believe that design has the power to simplify complex information, generate business results, and establish new and exciting connections with audiences.",
  "We are looking forward to learning more about this exciting journey ______________ is embarking on, and we are ready to support you in achieving your strategic objectives.",
  "Thank you,\nNagarro Team",
];

export default {
  name: "main/note-02", slide: -71, figmaNode: "342:37342",
  family: "main", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A cover letter / note to the client: a heading on the left with a single wide column of text, vertically centred.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 4, stats: 0, icons: 0 },
  description: "main/note-02 — heading left + single centred column of letter text.",
  schema: {
    title: "string — heading", body: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "A Note From Us", body: NOTE_BODY,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-note2 reveal">
          <div class="v2f-mn-note2-head"><p class="v2f-mn-h2">${esc(s.title ?? "A Note From Us")}</p></div>
          <div class="v2f-mn-prose airy">${body}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
