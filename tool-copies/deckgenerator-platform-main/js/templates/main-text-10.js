// Template: main/text-10 — a heading over three columns of bulleted assumptions/notes.
// Source Figma frame 342:40648.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const ITEMS = [
  "The fan entity already exists in the platform database — identity, rewards points, preferences, and profiles are all live.",
  "The current platform operates across a public website and an authenticated area sharing a common backend.",
  "Content is consumed headlessly; all rendering is owned by the front-end.",
  "Brand assets, imagery, and media are available in the DAM with appropriate CDN caching.",
  "The backend already serves the front-end with competition, player, registration, and user-management APIs.",
  "Basic role separation already exists; Phase 1 extends this to a 5-tier RBAC model.",
  "A dedicated SPOC will be assigned to streamline communication and resolve blockers promptly.",
  "Existing design foundations will be reused and evolved rather than replaced by a standalone design-system program.",
  "Analytics and consent management are assumed deployed and configured ahead of launch.",
  "Community features will be delivered via a third-party platform, limited to widget injection, SSO, and CSS theming.",
  "Player pages already exist with minimal data and will be enhanced with timelines, rankings, and verified badges.",
  "Search infrastructure is either available in the cloud environment or will be provisioned.",
];

export default {
  name: "main/text-10", slide: -11, figmaNode: "342:40648",
  family: "main", role: "content", shape: "list", theme: "light", chrome: false,
  use: "A heading over three columns of bulleted assumptions or notes.",
  media: [], capacity: { items: 12, min: 6, max: 18 },
  slots: { images: 0, titles: 1, body: 12, stats: 0, icons: 0 },
  description: "main/text-10 — heading + 3 columns of bullet items.",
  schema: {
    title: "string — heading", items: "array of bullet strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Assumptions Taken", items: ITEMS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const items = s.items || ITEMS;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tx10 reveal">
          ${s.title ? `<p class="ttl">${esc(s.title)}</p>` : ""}
          <div class="v2f-mn-asmp-cols c3">
            <ul class="v2f-mn-asmp-list">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
