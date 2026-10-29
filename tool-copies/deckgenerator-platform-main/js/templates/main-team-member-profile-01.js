// Template: main/team-member-profile-01 — a CV/profile: name, role, bio, a dense
// paragraph block and three key-output stats on the left, a full-height portrait on the
// right. Source Figma frame 342:40739.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { plAvatar } from "../planning-blocks.js";

const BIO = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus et  malesuada fames ac turpis egestas. Nulla at risus.";
const DENSE = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget  ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa.  Pellentesque habitant morbi tristique senectus et netus et malesuada  fames ac turpis egestas. Nulla at risus. Quisque purus magna, auctor et, sagittis ac, posuere eu, lectus.",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget  ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa.  Pellentesque habitant morbi tristique senectus et netus et malesuada  fames ac turpis egestas. Nulla at risus. Quisque purus magna, auctor et, sagittis ac, posuere eu, lectus.",
];
const STATS = [{ num: "00+", lbl: "Key output" }, { num: "00+", lbl: "Key output" }, { num: "00+", lbl: "Key output" }];

export default {
  name: "main/team-member-profile-01", slide: -4, figmaNode: "342:40739",
  family: "main", role: "team", shape: "split", theme: "light", chrome: false,
  use: "A member profile — name, role, bio and key-output stats on the left, a full-height portrait on the right.",
  media: ["portrait"], capacity: { items: 3, min: 1, max: 3 },
  slots: { images: 1, titles: 1, body: 3, stats: 3, icons: 0 },
  description: "main/team-member-profile-01 — CV split: bio + stats left, portrait right.",
  intent: { bestFor: ["one Nagarro team member's profile: role, bio and key outcomes"], holds: "one person: name, role, a short bio and up to 3 stats", avoid: ["a client's roles or job titles", "risks, owners or workstreams", "interview or research participants", "quotes from people outside the team — the photos show Nagarro people and would be read as them"], feel: "visual", needs: ["a portrait photo of that person"] },
  schema: {
    name: "string", role: "string", bio: "string", body: "array of paragraph strings",
    stats: "array of { num, lbl }", photo: "string — portrait src",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    name: "Name Surname", role: "Role/Position", bio: BIO, body: DENSE, stats: STATS, photo: plAvatar(6),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const stats = s.stats || STATS;
    const dense = (s.body || DENSE).map((p) => `<p>${esc(p)}</p>`).join("");
    return `
      <div class="v2f-root v2f-mn-prof-root">
        <div class="side">
          ${topBar(s.meta)}
          <div class="body">
            <div class="head">
              <p class="nm">${esc(s.name ?? "Name Surname")}</p>
              <p class="rl">${esc(s.role ?? "Role/Position")}</p>
            </div>
            ${s.bio ? `<p class="bio">${esc(s.bio)}</p>` : ""}
            <div class="dense">${dense}</div>
            <div class="stats">
              ${stats.map((st) => `<div class="stat"><p class="num">${esc(st.num)}</p><p class="lbl">${esc(st.lbl)}</p></div>`).join("")}
            </div>
          </div>
          ${footerBar(s.footer)}
        </div>
        <div class="photo"><img src="${esc(s.photo || plAvatar(6))}" alt=""></div>
      </div>`;
  },
};
