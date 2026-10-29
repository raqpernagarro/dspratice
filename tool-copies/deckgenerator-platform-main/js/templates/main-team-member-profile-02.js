// Template: main/team-member-profile-02 — a CV/profile with a skills sidebar: name, role,
// bio, a dense paragraph block beside a skills/software/industry list, three key-output
// stats, and a portrait on the right. Source Figma frame 342:40762.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { plAvatar } from "../planning-blocks.js";

const BIO = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus et  malesuada fames ac turpis egestas. Nulla at risus.";
const DENSE = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget  ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa.  Pellentesque habitant morbi tristique senectus et netus et malesuada  fames ac turpis egestas. Nulla at risus. Quisque purus magna, auctor et, sagittis ac, posuere eu, lectus.",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget  ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa.  Pellentesque habitant morbi tristique senectus et netus et malesuada  fames ac turpis egestas. Nulla at risus. Quisque purus magna, auctor et, sagittis ac, posuere eu, lectus.",
];
const SIDE = [
  { h: "Skills", t: "Miro, Jira, FigJam, Zeplin" },
  { h: "Software", t: "Figma, Sketch,  Adobe CC Suite" },
  { h: "Industry Experience", list: ["Healthcare", "Energy", "Public Sector", "Fintech", "Hospitality", "AR / MR / VR"] },
];
const STATS = [{ num: "00+", lbl: "Key output" }, { num: "00+", lbl: "Key output" }, { num: "00+", lbl: "Key output" }];

export default {
  name: "main/team-member-profile-02", slide: -3, figmaNode: "342:40762",
  family: "main", role: "team", shape: "split", theme: "light", chrome: false,
  use: "A member profile with a skills sidebar — bio, dense text and a skills/software/industry list, key-output stats, and a portrait.",
  media: ["portrait"], capacity: { items: 3, min: 1, max: 3 },
  slots: { images: 1, titles: 1, body: 5, stats: 3, icons: 0 },
  description: "main/team-member-profile-02 — CV with skills sidebar + portrait.",
  intent: { bestFor: ["one Nagarro team member's profile with skills and tools"], holds: "one person: bio, skills list and up to 3 stats", avoid: ["a client's roles or job titles", "risks, owners or workstreams", "interview or research participants", "quotes from people outside the team — the photos show Nagarro people and would be read as them"], feel: "dense", needs: ["a portrait photo of that person"] },
  schema: {
    name: "string", role: "string", bio: "string", body: "array of paragraph strings",
    side: "array of { h, t?, list? }", stats: "array of { num, lbl }", photo: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    name: "Name Surname", role: "Role/Position", bio: BIO, body: DENSE, side: SIDE, stats: STATS, photo: plAvatar(10),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const stats = s.stats || STATS;
    const dense = (s.body || DENSE).map((p) => `<p>${esc(p)}</p>`).join("");
    const side = (s.side || SIDE).map((b) => `<div class="sb">
      <p class="h">${esc(b.h)}</p>
      ${b.list ? `<ul>${b.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="t">${esc(b.t || "")}</p>`}
    </div>`).join("");
    return `
      <div class="v2f-root v2f-mn-prof-root v2f-mn-prof2-root">
        <div class="side">
          ${topBar(s.meta)}
          <div class="body">
            <div class="head">
              <p class="nm">${esc(s.name ?? "Name Surname")}</p>
              <p class="rl">${esc(s.role ?? "Role/Position")}</p>
            </div>
            ${s.bio ? `<p class="bio">${esc(s.bio)}</p>` : ""}
            <div class="mid">
              <div class="dense">${dense}</div>
              <div class="sidebar">${side}</div>
            </div>
            <div class="stats">
              ${stats.map((st) => `<div class="stat"><p class="num">${esc(st.num)}</p><p class="lbl">${esc(st.lbl)}</p></div>`).join("")}
            </div>
          </div>
          ${footerBar(s.footer)}
        </div>
        <div class="photo"><img src="${esc(s.photo || plAvatar(10))}" alt=""></div>
      </div>`;
  },
};
