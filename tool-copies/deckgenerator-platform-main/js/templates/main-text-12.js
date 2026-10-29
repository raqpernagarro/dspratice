// Template: main/text-12 — a heading over three columns of bulleted assumptions/notes,
// vertically centred in the body. Source Figma frame 342:40663.
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
  "Community features will be delivered via a third-party platform, limited to widget injection, SSO, and CSS theming.",
  "Analytics and consent management are assumed deployed and configured ahead of launch.",
];

export default {
  name: "main/text-12", slide: -9, figmaNode: "342:40663",
  family: "main", role: "content", shape: "list", theme: "light", chrome: false,
  use: "A heading over three columns of bulleted assumptions or notes, vertically centred.",
  media: [], capacity: { items: 12, min: 6, max: 15 },
  slots: { images: 0, titles: 1, body: 12, stats: 0, icons: 0 },
  description: "main/text-12 — heading + 3 columns of bullet items, centred.",
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
        <div class="v2f-mn-tx12 reveal">
          ${s.title ? `<p class="ttl">${esc(s.title)}</p>` : ""}
          <div class="mid">
            <div class="v2f-mn-asmp-cols c3">
              <ul class="v2f-mn-asmp-list">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
