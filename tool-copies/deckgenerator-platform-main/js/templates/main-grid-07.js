// Template: main/grid-07 — a dark "we have so much to offer" overview: three cards —
// a client logo wall, plus two "bubble chain" panels (areas, technology) of
// overlapping white circles. Source Figma frame 436:29923.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

// The "We work with" wall is the exact Figma logo composition (18 client logos)
// exported as one white-on-transparent image, so the arrangement matches 1:1.
const CLIENTS_IMG = "assets/main/grid07-clients.png";

// Each panel is columns of overlapping circles; a trailing `more:true` = outlined.
const AREAS = [
  [{ t: "Innovation" }, { t: "Legacy Modernization" }, { t: "Business Resilience" }],
  [{ t: "Connected Workforce" }, { t: "Customer Experience Design" }, { t: "& many more…", more: true }],
  [{ t: "Digital Transformation" }, { t: "Employee Safety" }],
];
const TECH = [
  [{ t: "Business Intelligence" }, { t: "Azure, AWS, Google Cloud, Alibaba.com" }, { t: "Salesforce" }, { t: "& many more…", more: true }],
  [{ t: "AI/ML" }, { t: "Microsoft" }, { t: "Sitecore" }],
  [{ t: "Low Code Platforms" }, { t: "SAP" }, { t: "IoT & Reality Tech" }],
];

const bubbleChain = (cols) => `
  <div class="v2f-mn-g7-chain">
    ${cols.map((col) => `<div class="col">${col
      .map((b) => `<span class="bub${b.more ? " more" : ""}"><span>${esc(b.t)}</span></span>`)
      .join("")}</div>`).join("")}
  </div>`;

export default {
  name: "main/grid-07", slide: -42, figmaNode: "436:29923",
  family: "main", role: "content", shape: "grid", theme: "dark", chrome: false,
  use: "A dark capability overview — a client logo wall beside two 'bubble chain' panels (areas, technology).",
  media: ["logo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 12, titles: 4, body: 0, stats: 0, icons: 0 },
  description: "main/grid-07 — dark 3-card overview: logo wall + two overlapping-circle panels.",
  schema: {
    title: "string — slide heading",
    clientsLabel: "string", areasLabel: "string", techLabel: "string",
    clientsImage: "client logo wall image URL",
    areas: "array of columns of { t, more? }", tech: "array of columns of { t, more? }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "We have so much to offer",
    clientsLabel: "We work with", areasLabel: "In multiple areas", techLabel: "Across technology",
    clientsImage: CLIENTS_IMG, areas: AREAS, tech: TECH,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const clientsImg = s.clientsImage || CLIENTS_IMG;
    return `
      <div class="v2f-root v2f-dark">
        ${topBar(s.meta)}
        <div class="v2f-mn-g7 reveal">
          ${pageHeader({ title: s.title ?? "" })}
          <div class="v2f-mn-g7-cards">
            <div class="v2f-mn-g7-card">
              <p class="lbl">${esc(s.clientsLabel ?? "")}</p>
              <div class="v2f-mn-g7-wall">${clientsImg ? `<img src="${esc(clientsImg)}" alt="Client logos">` : ""}</div>
            </div>
            <div class="v2f-mn-g7-card">
              <p class="lbl">${esc(s.areasLabel ?? "")}</p>
              ${bubbleChain(s.areas || AREAS)}
            </div>
            <div class="v2f-mn-g7-card">
              <p class="lbl">${esc(s.techLabel ?? "")}</p>
              ${bubbleChain(s.tech || TECH)}
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
