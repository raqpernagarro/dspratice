// Template: main/team-member-profile-03 — a full-text CV: name/role over two columns —
// work experience, key skills and education on the left; key projects on the right.
// Source Figma frame 342:40811.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const WORK = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et  malesuada fames ac turpis egestas. Nulla at risus. Quisque purus magna, auctor et, sagittis ac, posuere eu, lectus. Nam mattis, felis ut  adipiscing.Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus et  malesuada fames ac turpis.";
const SKILLS = [
  { h: "Software", t: "Photoshop, Illustrator, After Effects, Sketch, Figma, 3D Maya, Miro, Dovetail, Zeplin, and others" },
  { h: "Discovery", t: "User research, user interviews, stakeholder interviews, workshops, persona building, task analysis, journey mapping, card sorting, feature definition, and design sprints" },
  { h: "Design", t: "Solution conceptualization, navigation, information architecture, wireframes, prototypes, visual design, user interface design, data visualization, user flows" },
  { h: "Evaluation", t: "Usability testing, emotional response testing, accessibility evaluation, A/B or multivariant testing" },
];
const EDU = ["Lorem ipsum dolor sit amet, consectetur adipiscing elit", "Lorem ipsum dolor sit amet, consectetur adipiscing elit", "Lorem ipsum dolor sit amet, consectetur adipiscing elit", "Lorem ipsum dolor sit amet, consectetur adipiscing elit", "Lorem ipsum dolor sit amet, consectetur adipiscing elit"];
const PROJECTS = [
  { name: "Project name", overview: "Client is a leader in the global hospitality industry.", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus et  malesuada fames ac turpis egestas.", bullets: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit", "Lorem ipsum dolor sit amet, consectetur adipiscing elit", "Lorem ipsum dolor sit amet, consectetur adipiscing elit", "Lorem ipsum dolor sit amet, consectetur adipiscing elit"] },
  { name: "Project name", overview: "Client is a leader in the global hospitality industry.", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus et  malesuada fames ac turpis egestas.", bullets: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit", "Lorem ipsum dolor sit amet, consectetur adipiscing elit", "Lorem ipsum dolor sit amet, consectetur adipiscing elit", "Lorem ipsum dolor sit amet, consectetur adipiscing elit"] },
];

export default {
  name: "main/team-member-profile-03", slide: -2, figmaNode: "342:40811",
  family: "main", role: "team", shape: "table", theme: "light", chrome: false,
  use: "A full-text member CV — work experience, key skills and education on the left, key projects on the right.",
  media: [], capacity: { items: 2, min: 1, max: 3 },
  slots: { images: 0, titles: 1, body: 12, stats: 0, icons: 0 },
  description: "main/team-member-profile-03 — 2-column full-text CV.",
  intent: { bestFor: ["one Nagarro team member's CV: experience, skills, education, projects"], holds: "one person's full CV", avoid: ["anyone outside the team", "a summary of a team"], feel: "dense", needs: [] },
  schema: {
    name: "string", role: "string", work: "string — work-experience paragraph",
    skills: "array of { h, t }", education: "array of strings",
    projects: "array of { name, overview, body, bullets:[] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    name: "Name Surname", role: "Role/Position", work: WORK, skills: SKILLS, education: EDU, projects: PROJECTS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const skills = (s.skills || SKILLS).map((k) => `<p class="k"><b>${esc(k.h)} :</b> ${esc(k.t)}</p>`).join("");
    const edu = (s.education || EDU).map((e) => `<li>${esc(e)}</li>`).join("");
    const projects = (s.projects || PROJECTS).map((p) => `<div class="proj">
      <p class="pn">${esc(p.name)}</p>
      <p class="ov"><b>Overview:</b> ${esc(p.overview)}${p.body ? " " + esc(p.body) : ""}</p>
      <ul>${(p.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
    </div>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-prof3 reveal">
          <div class="head">
            <p class="nm">${esc(s.name ?? "Name Surname")}</p>
            <p class="rl">${esc(s.role ?? "Role/Position")}</p>
          </div>
          <div class="cols">
            <div class="col">
              <p class="sh">Work experience</p>
              <p class="wk">${esc(s.work ?? WORK)}</p>
              <p class="sh">Key skills</p>
              <div class="skills">${skills}</div>
              <p class="sh">Education and certifications</p>
              <ul class="edu">${edu}</ul>
            </div>
            <div class="col">
              <p class="sh">Key projects</p>
              ${projects}
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
