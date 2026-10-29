// Template: planning/cover — "Roadmap": split head over a week timeline with pills
// and a bulleted note under the active (Today) node. Source Figma frame 105:2633.
import { frame } from "../frame.js";
import { plSplitHead, plWeekTimeline } from "../planning-blocks.js";

export default {
  name: "planning/cover", slide: 156, figmaNode: "105:2633",
  family: "planning", role: "timeline", shape: "timeline", theme: "light", chrome: false,
  use: "A roadmap opener: a horizontal week/milestone timeline with a highlighted 'today' marker and a short note beneath it.",
  media: [], capacity: { items: 5, min: 3, max: 7 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "planning/cover — split head + a week timeline (pills on an axis, note under the active node).",
  schema: {
    caption: "string", title: "string", subtitle: "string", body: "string — intro paragraph",
    items: "array of { label, active }", bullets: "array of strings under the active node",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Roadmap", subtitle: "Subtitle",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    items: [
      { label: "Week 1" }, { label: "Today", active: true },
      { label: "Week 1" }, { label: "Week 1" }, { label: "Week 1" },
    ],
    bullets: ["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "59" },
  },
  render(s) {
    return frame(
      plSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }) +
      plWeekTimeline({ items: s.items || [], bullets: s.bullets || [] }),
      { meta: s.meta, footer: s.footer });
  },
};
