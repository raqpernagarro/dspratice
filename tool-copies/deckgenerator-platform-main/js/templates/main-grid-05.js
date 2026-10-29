// Template: main/grid-05 — a large heading on the left with two columns of rich body
// copy (bold lead-ins + supporting text) on the right. Source Figma frame (main/grid-05,
// section 342:43164).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const COLUMNS = [
  [
    { lead: "Our existing relationship:", text: "As a trusted technology partner to FIFA over the past three years, Nagarro brings unique familiarity with FIFA’s digital landscape, operating model, and stakeholder expectations. We remain committed to supporting FIFA’s digital transformation journey and are confident that this collaboration will deliver meaningful value for FIFA and its global community." },
    { lead: "Our Domain capabilities:", text: "We have more than 15 years of extensive experience working with great brands in sports, media, and gaming industry during which we have created bespoke service offerings and AI driven accelerators for driving value for our clients. We have close to 30+ large accounts with 500+ IT specialists working across the globe for our clients in this industry." },
    { lead: "Our expertise in creating impactful digital experiences:", text: "We have a dedicated digital experiences practice with leadership having more than 20 years of experience in creating digital experience platforms across technologies and industries. We have strong partnerships with leading DXPs like Contentful, Sitecore, Adobe, Acquia, Builder.io to name a few. We have also developed AI powered tools and accelerators to meet the DX vision of our clients across the globe." },
  ],
  [
    { lead: "Our commitment to provide the right talent to FIFA:", text: "At Nagarro, we believe in hiring and retaining the best talent across the globe, and we have provided sample profiles in this proposal to demonstrate our technical and functional skills to FIFA." },
    { lead: "Experience in implementing similar projects:", text: "We have worked with global brands to redesign their websites, consulted them on the features to enhance engagement, built personalised and immersive experiences and built the technical foundation to enable all these transformations. We have provided some select examples in this proposal." },
    { lead: "Not just a technology partner:", text: "We position ourselves not just as implementation partners but also as consulting partners to our clients by bringing in our thinking breakthrough framework and consulting frameworks like design++ that can help us identify future tracks for transformation for FIFA." },
    { text: "Details around all these points are present in Section 8 : Why Nagarro" },
  ],
];

export default {
  name: "main/grid-05", slide: -49, figmaNode: "342:37729",
  family: "main", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A large question/heading on the left with two columns of bold-led explanatory paragraphs.",
  media: [], capacity: { items: 8, min: 2, max: 8 },
  slots: { images: 0, titles: 1, body: 8, stats: 0, icons: 0 },
  description: "main/grid-05 — heading left + two columns of rich body copy.",
  schema: {
    title: "string — heading/question",
    columns: "array of two arrays of { lead?, text }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Why choose Nagarro as your transformation partner?",
    columns: COLUMNS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cols = (s.columns || COLUMNS).map((col) => `
      <div class="v2f-mn-grid5-col">
        ${(col || []).map((p) => `<p>${p.lead ? `<b>${esc(p.lead)}</b> ` : ""}${esc(p.text)}</p>`).join("")}
      </div>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-grid5 reveal">
          <div class="v2f-mn-grid5-head"><p class="v2f-mn-h">${esc(s.title ?? "")}</p></div>
          <div class="v2f-mn-grid5-cols">${cols}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
