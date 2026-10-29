// Template: main/note-05 — "A Note From Us": a heading + letter text in the left
// column with a full-height team photo on the right. Source frame 342:37361.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const TEAM_PHOTO = "assets/photography/20200717-100418_Nagarro_700.jpg";

const NOTE_BODY = [
  "First and foremost, thank you for inviting us to submit a proposal for the UX/UI Design, Prototyping & Validation of the ______________ Project.",
  "At Nagarro, we believe that design has the power to simplify complex information, generate business results, and establish new and exciting connections with audiences. We are excited to contribute to the operational effectiveness of the ______________ project with innovative approaches that deliver impact.",
  "Our Product team has extensive experience in User Experience, User Interface Design, User Testing, and Validation, and we are thrilled to have the opportunity to help the ______________ team bring its vision one step closer to reality.",
  "We are looking forward to learning more about this exciting journey ______________ is embarking on, and we are ready to support you in achieving your strategic objectives.",
  "Thank you,\nNagarro Team",
];

export default {
  name: "main/note-05", slide: -68, figmaNode: "342:37361",
  family: "main", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A cover letter / note to the client alongside a full-height team photo on the right.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 5, stats: 0, icons: 0 },
  description: "main/note-05 — heading + letter left, team photo right.",
  schema: {
    title: "string — heading", body: "array of paragraph strings", image: "photo URL",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "A Note From Us", body: NOTE_BODY, image: TEAM_PHOTO,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "412" },
  },
  render(s) {
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-note5 reveal">
          <div class="v2f-mn-note5-left">
            <p class="v2f-mn-h2">${esc(s.title ?? "A Note From Us")}</p>
            <div class="v2f-mn-note5-body"><div class="v2f-mn-prose">${body}</div></div>
          </div>
          <div class="v2f-mn-note5-photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
