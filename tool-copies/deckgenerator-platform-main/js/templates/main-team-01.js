// Template: main/team-01 — a "Team" heading over a row of five member cards (portrait
// photo + name + role). Source Figma frame 342:40671.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { plAvatar } from "../planning-blocks.js";

const MEMBERS = [
  { name: "Name", role: "Role/Position" }, { name: "Name", role: "Role/Position" },
  { name: "Name", role: "Role/Position" }, { name: "Name", role: "Role/Position" },
  { name: "Name", role: "Role/Position" },
];

export default {
  name: "main/team-01", slide: -8, figmaNode: "342:40671",
  family: "main", role: "team", shape: "row", theme: "light", chrome: false,
  use: "A team heading over a row of member cards, each with a portrait photo, name and role.",
  media: ["portrait"], capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 5, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/team-01 — heading + row of 5 member cards.",
  intent: { bestFor: ["the presenting team as a row of members"], holds: "3–5 team members, each a name and role", itemChars: 40, avoid: ["a client's roles or job titles", "risks, owners or workstreams", "interview or research participants", "quotes from people outside the team — the photos show Nagarro people and would be read as them"], feel: "visual", needs: ["portrait photos of the team"] },
  schema: {
    title: "string — heading", members: "array of { name, role, photo? }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Team", members: MEMBERS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const members = s.members || MEMBERS;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-team1 reveal">
          ${s.title ? `<p class="ttl">${esc(s.title)}</p>` : ""}
          <div class="grid">
            ${members.map((m, i) => `<div class="card">
              <span class="ph"><img src="${esc(m.photo || plAvatar(i))}" alt=""></span>
              <p class="nm">${esc(m.name)}</p>
              <p class="rl">${esc(m.role)}</p>
            </div>`).join("")}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
