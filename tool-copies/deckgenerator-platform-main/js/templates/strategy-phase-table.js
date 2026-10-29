// Template: strategy/grid-03 — "Outlook" funnel: a head over a dotted phase-axis
// header and a row×phase text table. Light theme. Source Figma frame 109:8820.
import { frame } from "../frame.js";
import { stSplitHead, stPhaseTable } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-03",
  slide: 144,
  figmaNode: "109:8820",
  family: "strategy",
  role: "timeline",
  shape: "table",
  theme: "light",
  chrome: false,
  use: "A phased plan laid out on a timeline: several phases across a dotted axis, with a row of dimensions (content, messaging …) filled in per phase.",
  media: [],
  capacity: { items: 4, min: 2, max: 5 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "strategy/grid-03 — head + dotted phase axis over a row×phase text table.",
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    phases: "array of phase labels",
    rows: "array of { label, cells:[string] } — one cell per phase",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Outlook", subtitle: "Subtitle",
    phases: ["Phase 1", "Phase 1", "Phase 1", "Phase 1"],
    rows: ["Content mix", "TBD", "Messaging", "Content mix"].map((label) => ({
      label,
      cells: Array(4).fill("Lorem ipsum dolor sit amet, consectetur adipiscing elit."),
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "148" },
  },
  render(s) {
    const middle =
      stSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle }) +
      stPhaseTable({ phases: s.phases || [], rows: s.rows || [] });
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
