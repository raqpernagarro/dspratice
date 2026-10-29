// Template: planning/grid-04 — "Phases": a split head over four dashed dome arches,
// each numbered + labelled. Source Figma frame 105:2712.
import { frame } from "../frame.js";
import { plSplitHead, plArches } from "../planning-blocks.js";

export default {
  name: "planning/grid-04", slide: 160, figmaNode: "105:2712",
  family: "planning", role: "diagram", shape: "arches", theme: "light", chrome: false,
  use: "A phased journey drawn as a run of arches, each phase numbered with a short description below.",
  media: [], capacity: { items: 4, min: 3, max: 5 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "planning/grid-04 — split head + a row of dashed dome arches with numbered phase labels.",
  schema: {
    caption: "string", title: "string", subtitle: "string", body: "string",
    phases: "array of { num, label, body, active }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Phases", subtitle: "Subtitle",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    phases: [
      { num: "01", label: "Phase", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", active: true },
      { num: "02", label: "Phase", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
      { num: "03", label: "Phase", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
      { num: "04", label: "Phase", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "63" },
  },
  render(s) {
    return frame(
      plSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }) + plArches(s.phases || []),
      { meta: s.meta, footer: s.footer });
  },
};
