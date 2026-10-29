// Template: main/note-04 — "A Note From Us": a heading at the top with the letter
// text as a single block centred in the space below. Source frame 342:37353.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const NOTE_BODY = [
  "First and foremost, thank you for inviting us to submit a proposal for the UX/UI Design, Prototyping & Validation of the ______________ Project.",
  "At Nagarro, we believe that design has the power to simplify complex information, generate business results, and establish new and exciting connections with audiences. We are excited to contribute to the operational effectiveness of the ______________ project with innovative approaches that deliver impact.",
  "Our Product team has extensive experience in User Experience, User Interface Design, User Testing, and Validation, and we are thrilled to have the opportunity to help the ______________ team bring its vision one step closer to reality.",
  "We are looking forward to learning more about this exciting journey ______________ is embarking on, and we are ready to support you in achieving your strategic objectives.",
  "Thank you,\nNagarro Team",
];

export default {
  name: "main/note-04", slide: -69, figmaNode: "342:37353",
  family: "main", role: "content", shape: "single", theme: "light", chrome: false,
  use: "A cover letter / note to the client: a heading at the top with the message centred in the space below.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 5, stats: 0, icons: 0 },
  description: "main/note-04 — heading top + dense single-column letter, centred lower.",
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
        <div class="v2f-mn-note4 reveal">
          <p class="v2f-mn-h2">${esc(s.title ?? "A Note From Us")}</p>
          <div class="v2f-mn-note4-body"><div class="v2f-mn-prose">${body}</div></div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
