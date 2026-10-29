// Template: main/split-03 — a technology-stack table: eyebrow + heading over a table
// with a grey header band and category-grouped rows (category label + sub-rows of
// sub-category / tools / licensing). Source Figma frame 342:39803.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

const COLS = ["Category", "Sub-category", "Description Tool/Technologies", "Licensing"];
const GROUPS = [
  { cat: "Frontend", subs: [
    { s: "User Interface: Orchestrator", t: "HTML5, CSS3, Typescript, React, Socket.io, webworkers, react-hook-form, RxJs, Vite", l: "Apache 2.0, MIT" },
    { s: "User Interface: Scene", t: "React Three Fiber (R3F), Zustand, RxJs, Vite-plugin-federation, emotion, Reavis, VisX, React Spring", l: "Apache 2.0, MIT, Mulan PSL v2" },
    { s: "Unit Testing", t: "Vitest", l: "MIT" },
  ] },
  { cat: "Backend", subs: [
    { s: "Microservices", t: "Nodejs, Express.js, Websocket & RESTful services, Jest", l: "Apache 2.0" },
    { s: "Event messaging", t: "Kafka & Redis streams", l: "Apache 2.0" },
    { s: "Data Store", t: "Redis", l: "—" },
    { s: "Containerization", t: "Docker", l: "Apache 2.0" },
    { s: "Real-time Service", t: "Socket.io (websockets)", l: "MIT" },
  ] },
  { cat: "Observability", subs: [{ s: "NA", t: "NA", l: "NA" }] },
  { cat: "Authentication Platform", subs: [{ s: "NA", t: "NA", l: "NA" }] },
  { cat: "Design", subs: [{ s: "UX/UI & Dev Tools", t: "Figma", l: "—" }] },
];

export default {
  name: "main/split-03", slide: -30, figmaNode: "342:39803",
  family: "main", role: "content", shape: "table", theme: "light", chrome: false,
  use: "A technology-stack table — heading over a grouped table (category + sub-category / tools / licensing).",
  media: [], capacity: { items: 12, min: 3, max: 16 },
  slots: { images: 0, titles: 1, body: 12, stats: 0, icons: 0 },
  description: "main/split-03 — eyebrow + heading + grouped technology-stack table.",
  schema: {
    caption: "string — eyebrow", title: "string — heading", cols: "array of 4 headers",
    groups: "array of { cat, subs:[{ s, t, l }] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", cols: COLS, groups: GROUPS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cols = s.cols || COLS;
    const groups = s.groups || GROUPS;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tblwrap reveal">
          ${pageHeader({ caption: s.caption, title: s.title ?? "" })}
          <div class="v2f-mn-t3">
            <div class="head">${cols.map((c) => `<span>${esc(c)}</span>`).join("")}</div>
            <div class="body">
              ${groups.map((g) => `
                <div class="grp">
                  <div class="cat">${esc(g.cat)}</div>
                  <div class="subs">
                    ${g.subs.map((r) => `<div class="sub"><span>${esc(r.s)}</span><span>${esc(r.t)}</span><span>${esc(r.l)}</span></div>`).join("")}
                  </div>
                </div>`).join("")}
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
