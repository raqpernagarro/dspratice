// Template: main/grid-09 — a milestone dependency table: heading over a 4-column text
// table (Milestone / What BRAND receives / Key dependencies / Approval outcome).
// Source Figma frame 342:39778.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

const COLS = ["Milestone", "What BRAND receives", "Key dependencies", "Approval outcome"];
const ROWS = [
  { m: "M1",
    r: "Product vision and direction, platform analysis findings, journey hypotheses and opportunity mapping, IA direction, UX principles, low-fidelity wireframes for priority journeys, initial usability testing results and UX metrics",
    d: "Discovery inputs, access to current flows and analytics, existing design/assets, priority scope alignment, user-testing recruitment and scheduling, timely AJIO review and approval",
    o: "IA, UX principles, and priority journeys are tested and formally approved" },
  { m: "IM1",
    r: "Frontend foundations ready: repo setup, token pipeline, theming approach, component structure, linting / CI checks, environment readiness, implementation approach aligned to the existing stack",
    d: "M1 direction sufficiently stable, access to current frontend architecture, alignment with AJIO / vendor engineering, component model and token logic available, environment and pipeline access",
    o: "Frontend foundations are established and ready to support implementation of approved journeys" },
  { m: "M2",
    r: "Designs for priority journeys across Android, iOS, mSite, and desktop, initial design direction and visual language, initial core UI components, updated testing insights for priority flows",
    d: "M1 approved, platform constraints and responsive logic confirmed, alignment on what constitutes “core journeys,” timely design reviews, no major scope expansion after M1",
    o: "Priority journeys are fully designed across platforms, validated, and approved" },
  { m: "M3",
    r: "Final UI direction, visual design system, storefront expressions, edge-case and extreme-case coverage, accessibility review at design stage, matured tokens and component definitions, usability evidence.",
    d: "M2 approved, stable visual direction, storefront logic aligned, edge and exception scenarios confirmed, design system foundation sufficiently stable",
    o: "Final UI and visual design system are approved for the core release scope" },
];

export default {
  name: "main/grid-09", slide: -31, figmaNode: "342:39778",
  family: "main", role: "content", shape: "table", theme: "light", chrome: false,
  use: "A milestone dependency table — heading over a 4-column text table.",
  media: [], capacity: { items: 4, min: 2, max: 6 },
  slots: { images: 0, titles: 1, body: 12, stats: 0, icons: 0 },
  description: "main/grid-09 — heading + 4-column milestone/dependency table.",
  schema: {
    title: "string — heading", cols: "array of 4 column headers",
    rows: "array of { m, r, d, o }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Milestone Outputs & Dependencies", cols: COLS, rows: ROWS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cols = s.cols || COLS;
    const rows = s.rows || ROWS;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tblwrap reveal">
          ${pageHeader({ title: s.title ?? "" })}
          <div class="v2f-mn-tbl" style="grid-template-columns:124px 445px 519px 531px;">
            ${cols.map((c) => `<span class="th">${esc(c)}</span>`).join("")}
            ${rows.map((r) => `
              <span class="tm">${esc(r.m)}</span>
              <span class="td">${esc(r.r)}</span>
              <span class="td">${esc(r.d)}</span>
              <span class="td">${esc(r.o)}</span>`).join("")}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
