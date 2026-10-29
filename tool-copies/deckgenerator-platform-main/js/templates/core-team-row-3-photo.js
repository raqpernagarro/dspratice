// Template: core/team-row-3-photo — three portraits with name + role, light theme.
// Source Figma frame 109:5079. Uses the shared v2 frame (js/frame.js + .v2f-* CSS).
import { esc } from "../components.js";
import { frame, pageHeader } from "../frame.js";

const person = (p = {}) => `
  <article class="v2f-col">
    <div class="v2f-imgbox">${p.image ? `<img src="${esc(p.image)}" alt="">` : ""}</div>
    <div class="v2f-ctext">
      <div class="v2f-ctitle">
        <p class="v2f-ct">${esc(p.name ?? "")}</p>
        ${p.role ? `<p class="v2f-cs">${esc(p.role)}</p>` : ""}
      </div>
    </div>
  </article>`;

export default {
  name: "core/team-row-3-photo",
  slide: 17,
  figmaNode: "109:5079",
  family: "core",
  role: "team",
  shape: "row",
  count: 3,
  theme: "light",
  chrome: false,
  use: "Three portrait photos with a name and role beneath each. A team or leadership row.",
  media: ["photo"],
  capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 3, titles: 3, subtitles: 3, body: 0, stats: 0, icons: 0 },
  description: "core/team-row-3-photo — header, then three portraits with name + role.",
  intent: { bestFor: ["introducing two or three people of the presenting team"], holds: "2–3 team members, each a name and role", itemChars: 40, avoid: ["a client's roles or job titles", "risks, owners or workstreams", "interview or research participants", "quotes from people outside the team — the photos show Nagarro people and would be read as them"], feel: "visual", needs: ["portrait photos of the team"] },
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    people: "array of 3 {image, name, role}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Our team", subtitle: "Leadership",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "96" },
    people: [
      { image: "assets/photography/20200717-103815_Nagarro_958.jpg", name: "Name Surname", role: "Role / position" },
      { image: "assets/photography/20200717-104027_Nagarro_4306.jpg", name: "Name Surname", role: "Role / position" },
      { image: "assets/photography/20200717-104101_Nagarro_4314.jpg", name: "Name Surname", role: "Role / position" },
    ],
  },
  render(s) {
    const people = (s.people || []).slice(0, 3).map(person).join("");
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      `<div class="v2f-list reveal">${people}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
