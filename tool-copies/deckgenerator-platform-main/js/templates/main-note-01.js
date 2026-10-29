// Template: main/note-01 — "A Note From Us": a heading on the left with the letter
// text set in two columns on the right. Source Figma frame 342:37334.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const NOTE_BODY = [
  "First and foremost, thank you for inviting us to submit a proposal for the UX/UI Design, Prototyping & Validation of the ______________ Project.",
  "At Nagarro, we believe that design has the power to simplify complex information, generate business results, and establish new and exciting connections with audiences. We are excited to contribute to the operational effectiveness of the ______________ project with innovative approaches that deliver impact.",
  "Our Product team has extensive experience in User Experience, User Interface Design, User Testing, and Validation, and we are thrilled to have the opportunity to help the ______________ team bring its vision one step closer to reality.",
  "We are looking forward to learning more about this exciting journey ______________ is embarking on, and we are ready to support you in achieving your strategic objectives.",
  "Thank you,\nNagarro Team",
];
const col = (arr) => `<div class="v2f-mn-prose airy">${arr.map((p) => `<p>${esc(p)}</p>`).join("")}</div>`;

export default {
  name: "main/note-01", slide: -72, figmaNode: "342:37334",
  family: "main", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A cover letter / note to the client: a heading on the left with the message set in two columns on the right.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 5, stats: 0, icons: 0 },
  description: "main/note-01 — heading left, letter text in two columns.",
  schema: {
    title: "string — heading (e.g. A Note From Us)", body: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "A Note From Us", body: NOTE_BODY,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const body = s.body || [];
    const mid = Math.ceil(body.length / 2);
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-note1 reveal">
          <div class="v2f-mn-note1-head"><p class="v2f-mn-h2">${esc(s.title ?? "A Note From Us")}</p></div>
          <div class="v2f-mn-note1-cols">${col(body.slice(0, mid))}${col(body.slice(mid))}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
