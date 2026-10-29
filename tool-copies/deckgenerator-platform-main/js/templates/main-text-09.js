// Template: main/text-09 — a heading on the left with two columns of running assumption
// paragraphs on the right. Source Figma frame 342:40640.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const PARAS = [
  "The fan entity already exists in the platform database — identity, rewards points, game preferences, and profiles are all live. New preferences will be added as schema extensions to the existing data model.",
  "The current platform operates across a public website and an authenticated area as separate apps sharing a common backend. Content is consumed headlessly; all rendering is owned by the front-end.",
  "The backend already serves the front-end with competition, player, registration, and user-management APIs. Basic role separation exists, and Phase 1 extends this to a 5-tier RBAC model.",
  "A dedicated SPOC will be assigned to streamline communication, address issues promptly, and escalate potential delays to ensure smooth progress.",
  "Existing design foundations will be reused and evolved rather than replaced by a full standalone design-system program. Where needed, we introduce reusable front-end components and extend the pattern library.",
  "Analytics and consent management are assumed deployed. Community features are delivered via a third-party platform, limited to widget injection, SSO federation, and CSS theming to match the design system.",
];

export default {
  name: "main/text-09", slide: -12, figmaNode: "342:40640",
  family: "main", role: "content", shape: "list", theme: "light", chrome: false,
  use: "A heading on the left with two columns of running assumption paragraphs on the right.",
  media: [], capacity: { items: 8, min: 2, max: 10 },
  slots: { images: 0, titles: 1, body: 8, stats: 0, icons: 0 },
  description: "main/text-09 — heading left + 2 columns of running paragraphs.",
  schema: {
    title: "string — heading", paragraphs: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Assumptions Taken", paragraphs: PARAS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const paras = s.paragraphs || PARAS;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tx9 reveal">
          ${s.title ? `<p class="ttl">${esc(s.title)}</p>` : ""}
          <div class="cols">${paras.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
