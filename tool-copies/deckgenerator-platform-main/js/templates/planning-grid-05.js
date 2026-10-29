// Template: planning/grid-05 — "Phases": a split head over a single-row Gantt of
// phase pills across months, with a Today marker. Source Figma frame 105:2720.
import { frame } from "../frame.js";
import { plSplitHead, plGanttPills } from "../planning-blocks.js";

export default {
  name: "planning/grid-05", slide: 161, figmaNode: "105:2720",
  family: "planning", role: "chart", shape: "gantt", theme: "light", chrome: false,
  use: "A one-line schedule: consecutive phase pills sized by duration across a few months, with a Today marker.",
  media: [], capacity: { items: 5, min: 3, max: 7 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "planning/grid-05 — split head + a row of duration-sized phase pills with a Today marker.",
  intent: { bestFor: ["a short schedule of consecutive phases across a few months"], holds: "3–7 phases with start and end months", itemChars: 24, avoid: ["figures or measures", "more than a year"], feel: "visual", needs: ["dates for each phase"] },
  schema: {
    caption: "string", title: "string", subtitle: "string", body: "string",
    months: "array of month labels", pills: "array of { label, grow, active }", today: "{ at:0..1 }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Phases", subtitle: "Subtitle",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    months: ["January", "February", "March", "April"],
    pills: [
      { label: "Services", grow: 4 }, { label: "Ideation", grow: 1.4 }, { label: "Proposal", grow: 1.4 },
      { label: "Prototyping", grow: 2.6 }, { label: "Implementation", grow: 2.6, active: true },
    ],
    today: { at: 0.72 },
    meta: { studio: "Product Studio", name: "Presentation Name", page: "64" },
  },
  render(s) {
    return frame(
      plSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }) +
      plGanttPills({ months: s.months || [], pills: s.pills || [], today: s.today }),
      { meta: s.meta, footer: s.footer });
  },
};
