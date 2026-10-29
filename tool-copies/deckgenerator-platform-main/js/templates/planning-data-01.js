// Template: planning/data-01 — "Roadmap": bold head over a phase timeline (Kick off
// → phases) with month + notes per column. Source Figma frame 105:2643.
import { frame } from "../frame.js";
import { plBoldHead, plPhaseTimeline } from "../planning-blocks.js";

export default {
  name: "planning/data-01", slide: 157, figmaNode: "105:2643",
  family: "planning", role: "timeline", shape: "timeline", theme: "light", chrome: false,
  use: "A phased roadmap on a single axis: kickoff and successive phases, each with a month and a short note.",
  media: [], capacity: { items: 5, min: 3, max: 6 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "planning/data-01 — bold head + a phase timeline with month + note columns.",
  schema: {
    caption: "string", title: "string",
    phases: "array of { label, bold, month, sub, body }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Roadmap",
    phases: [
      { label: "Kick off", month: "Month", sub: "Lorem ipsum.", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      { label: "Phase 1", bold: true, month: "Month", sub: "Lorem ipsum.", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      { label: "Phase 2", month: "Month", sub: "Lorem ipsum.", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      { label: "Phase 3", month: "Month", sub: "Lorem ipsum.", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      { label: "Phase 4", month: "Month", sub: "Lorem ipsum.", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "60" },
  },
  render(s) {
    return frame(plBoldHead({ caption: s.caption, title: s.title }) + plPhaseTimeline(s.phases || []),
      { meta: s.meta, footer: s.footer });
  },
};
