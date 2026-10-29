// Template: main/grid-10 — a bold statement + intro on the left with an isometric stack
// of layers on the right, each layer connected to a labelled row (title + description).
// Source Figma frame 342:40216.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const LAYERS = [
  { t: "Experience", d: "What the user experiences" },
  { t: "Governance", d: "Documentation to Ensure Maintenance and Scalability" },
  { t: "Patterns", d: "Modules that become structured flows" },
  { t: "Components", d: "Rules manifested as UI Modules" },
  { t: "Motion", d: "Rules expressed through interaction and Transition" },
  { t: "Tokens", d: "Design Decisions per Brand, Store and Device that translate into rules" },
];

const CX = 340, HW = 190, HH = 95, TOP = 95, PITCH = 100;

export default {
  name: "main/grid-10", slide: -21, figmaNode: "342:40216",
  family: "main", role: "content", shape: "diagram", theme: "light", chrome: false,
  use: "A bold statement + intro on the left with an isometric stack of layers on the right, each connected to a labelled row.",
  media: [], capacity: { items: 6, min: 3, max: 7 },
  slots: { images: 0, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "main/grid-10 — bold statement + intro left, isometric layered stack right.",
  schema: {
    title: "string — bold statement", body: "array of intro paragraph strings",
    layers: "array of { t, d }  (top layer first)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Systems That Scale Across Brands, Stores, and Experiences",
    body: [
      "The design system is the central mechanism through which YOU can scale multiple stores, campaigns, and future experiences without repeatedly reinventing interface patterns.",
      "The design system acts as a business asset: something that reduces rework, speeds iteration, increases consistency, and makes future complexity manageable.",
    ],
    layers: LAYERS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    const layers = s.layers || LAYERS;
    const cyOf = (i) => TOP + i * PITCH;
    // draw bottom layer first so higher layers sit on top of the stack
    const diamonds = layers.map((_, i) => {
      const cy = cyOf(i);
      const pts = `${CX},${cy - HH} ${CX + HW},${cy} ${CX},${cy + HH} ${CX - HW},${cy}`;
      const fill = i === 0 ? "rgba(71,215,172,.85)" : "rgba(71,215,172,.14)";
      return `<polygon points="${pts}" fill="${fill}" stroke="rgba(71,215,172,.5)" stroke-width="1"/>`;
    }).reverse().join("");
    const connectors = layers.map((_, i) => {
      const cy = cyOf(i);
      return `<line x1="${CX + HW}" y1="${cy}" x2="700" y2="${cy}" stroke="var(--fg-100,#010716)" stroke-width="1"/>` +
        `<polygon points="700,${cy - 4} 708,${cy} 700,${cy + 4}" fill="var(--fg-100,#010716)"/>`;
    }).join("");
    const lastCy = cyOf(layers.length - 1);
    const rows = layers.map((l, i) => `<div class="row" style="top:${cyOf(i)}px;">
      <p class="t">${esc(l.t)}</p><p class="d">${esc(l.d)}</p>
    </div>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-g10 reveal">
          <div class="side">
            ${s.title ? `<p class="ttl">${esc(s.title)}</p>` : ""}
            <div class="v2f-mn-prose airy">${body}</div>
          </div>
          <div class="diagram">
            <svg viewBox="0 0 1180 720" width="1180" height="720" aria-hidden="true">
              ${diamonds}
              ${connectors}
              <line x1="${CX}" y1="${lastCy + HH + 12}" x2="${CX}" y2="20" stroke="var(--fg-100,#010716)" stroke-width="1.5"/>
              <polygon points="${CX - 6},34 ${CX + 6},34 ${CX},18" fill="var(--fg-100,#010716)"/>
              <circle cx="${CX}" cy="${lastCy + HH + 12}" r="5" fill="var(--fg-100,#010716)"/>
            </svg>
            ${rows}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
