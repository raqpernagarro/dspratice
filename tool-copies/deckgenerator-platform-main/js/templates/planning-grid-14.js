// Template: planning/grid-14 — annual calendar grid: four quarter columns of month
// cards. Source Figma frame 105:3494.
import { frame } from "../frame.js";
import { plSplitHead, plCalendar } from "../planning-blocks.js";

export default {
  name: "planning/grid-14", slide: 171, figmaNode: "105:3494",
  family: "planning", role: "diagram", shape: "calendar", theme: "light", chrome: false,
  use: "A year-at-a-glance calendar: four quarter columns, each holding three month cards with a headline.",
  media: [], capacity: { items: 12, min: 4, max: 12 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "planning/grid-14 — split head + a quarter × month annual calendar grid.",
  schema: {
    caption: "string", title: "string", subtitle: "string", body: "string — intro paragraph",
    quarters: "array of { label, months:[{ month, title }] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", subtitle: "Subtitle",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    quarters: [
      { label: "Q1", months: [{ month: "January", title: "Lorem Ipsum" }, { month: "February", title: "Lorem Ipsum" }, { month: "March", title: "Lorem Ipsum" }] },
      { label: "Q2", months: [{ month: "April", title: "Lorem Ipsum" }, { month: "May", title: "Lorem Ipsum" }, { month: "June", title: "Lorem Ipsum" }] },
      { label: "Q3", months: [{ month: "July", title: "Lorem Ipsum" }, { month: "August", title: "Lorem Ipsum" }, { month: "September", title: "Lorem Ipsum" }] },
      { label: "Q4", months: [{ month: "October", title: "Lorem Ipsum" }, { month: "November", title: "Lorem Ipsum" }, { month: "December", title: "Lorem Ipsum" }] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "74" },
  },
  render(s) {
    return frame(
      plSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }) +
      plCalendar(s.quarters || []),
      { meta: s.meta, footer: s.footer });
  },
};
