// Template: main/team-02 — a "Team" heading over two rows of five member cards
// (photo + name + role). Source Figma frame 342:40678.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { plAvatar } from "../planning-blocks.js";

const MEMBERS = Array.from({ length: 10 }, () => ({ name: "Name", role: "Role/Position" }));

export default {
  name: "main/team-02", slide: -7, figmaNode: "342:40678",
  family: "main", role: "team", shape: "grid", theme: "light", chrome: false,
  use: "A team heading over a grid of ten member cards, each with a photo, name and role.",
  media: ["portrait"], capacity: { items: 10, min: 6, max: 10 },
  slots: { images: 10, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "main/team-02 — heading + 5×2 grid of member cards.",
  intent: { bestFor: ["a larger presenting team, up to ten people"], holds: "6–10 team members, each a name and role", itemChars: 40, avoid: ["a client's roles or job titles", "risks, owners or workstreams", "interview or research participants", "quotes from people outside the team — the photos show Nagarro people and would be read as them"], feel: "visual", needs: ["portrait photos of the team"] },
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
    // avatar order tuned so every landscape crop lands on a face (skips the
    // office-building shot at index 6 in favour of a portrait).
    const ORDER = [0, 1, 2, 3, 4, 5, 15, 7, 8, 9];
    // per-avatar vertical crop (%) — a few portraits carry the face high/low
    const POS = { 3: 4, 4: 4, 2: 30 };
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-team1 v2f-mn-team2 reveal">
          ${s.title ? `<p class="ttl">${esc(s.title)}</p>` : ""}
          <div class="grid">
            ${members.map((m, i) => { const a = ORDER[i] ?? i; return `<div class="card">
              <span class="ph"><img src="${esc(m.photo || plAvatar(a))}" alt="" style="object-position:center ${POS[a] ?? 25}%"></span>
              <p class="nm">${esc(m.name)}</p>
              <p class="rl">${esc(m.role)}</p>
            </div>`; }).join("")}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
