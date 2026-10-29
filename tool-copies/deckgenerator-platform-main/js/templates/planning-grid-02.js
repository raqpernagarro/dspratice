// Template: planning/grid-02 — "Roadmap": an ascending staircase of target cards over
// a date timeline. Full-width. Source Figma frame 105:2653.
import { frame } from "../frame.js";
import { plSplitHead, plStaircase } from "../planning-blocks.js";

export default {
  name: "planning/grid-02", slide: 158, figmaNode: "105:2653",
  family: "planning", role: "timeline", shape: "staircase", theme: "light", chrome: false,
  use: "A roadmap of escalating milestones stepping up-and-right across a date timeline, with light placeholders for the ground still ahead.",
  media: [], capacity: { items: 7, min: 3, max: 8 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "planning/grid-02 — an ascending roadmap staircase over a date timeline.",
  schema: {
    caption: "string", title: "string", subtitle: "string",
    cards: "array of step labels (bottom-left → top-right)", ticks: "array of axis labels (cards.length + 1)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Roadmap", subtitle: "Subtitle",
    cards: Array(7).fill("Lorem ipsum"),
    ticks: ["Today", "June 2022", "December 2022", "June 2023", "December 2023", "June 2024", "December 2024", "Tomorrow"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "61" },
  },
  render(s) {
    return frame(
      plSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle }) +
      plStaircase({ cards: s.cards || [], ticks: s.ticks || [] }),
      { meta: s.meta, footer: s.footer });
  },
};
