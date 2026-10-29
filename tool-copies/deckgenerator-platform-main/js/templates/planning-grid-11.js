// Template: planning/grid-11 — "Timeline": a quarter-scale Gantt chart. Full-width.
// Source Figma frame 105:2898.
import { frame } from "../frame.js";
import { plBoldHead, plGantt, plPhaseBand } from "../planning-blocks.js";

export default {
  name: "planning/grid-11", slide: 167, figmaNode: "105:2898",
  family: "planning", role: "timeline", shape: "gantt", theme: "light", chrome: false,
  use: "A short-range Gantt: a handful of workstreams shown as bars across a few months.",
  media: [], capacity: { items: 4, min: 2, max: 8 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "planning/grid-11 — bold head + a Gantt chart over a few months.",
  schema: {
    caption: "string", title: "string",
    columns: "array of month labels", rows: "array of { label, start, span }",
    phases: "array of { label, body } — the footer band below the Gantt",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Timeline",
    columns: ["February", "March", "April"],
    // even rows are empty grey separators; odd rows carry the content (Gantt lanes)
    rows: [
      {},
      { label: "Lorem ipsum", start: 0, span: 1 },
      {},
      { label: "Lorem ipsum", start: 1, span: 1 },
      {},
      { label: "Lorem ipsum" },
      {},
      { label: "Lorem ipsum", start: 1, span: 2 },
    ],
    phases: Array(5).fill(0).map(() => ({
      label: "Lorem ipsum",
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "70" },
  },
  render(s) {
    const middle = plBoldHead({ caption: s.caption, title: s.title }) +
      `<div class="v2f-pl-g11 reveal">${plGantt({ columns: s.columns || [], rows: s.rows || [] })}${plPhaseBand(s.phases || [])}</div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
