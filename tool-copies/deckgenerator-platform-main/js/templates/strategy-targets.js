// Template: strategy/grid-13 — "Targets": an ascending staircase of target cards
// over a date timeline. Full-width, light theme.
// Source Figma frame 109:9079 (Strategy).
import { frame } from "../frame.js";
import { stSplitHead, stTargets } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-13",
  slide: 155,
  figmaNode: "109:9079",
  family: "strategy",
  role: "timeline",
  shape: "staircase",
  theme: "light",
  chrome: false,
  use: "A roadmap of escalating targets: filled milestone cards stepping up-and-right across a date timeline, with light placeholders for the space still ahead.",
  media: [],
  capacity: { items: 7, min: 3, max: 8 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "strategy/grid-13 — an ascending target-card staircase over a date timeline.",
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    cards: "array of step labels (bottom-left → top-right)",
    ticks: "array of axis labels (cards.length + 1)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Targets", subtitle: "Subtitle",
    cards: Array(7).fill("Lorem ipsum"),
    ticks: ["Today", "June 2022", "December 2022", "June 2023", "December 2023", "June 2024", "December 2024", "Tomorrow"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "159" },
  },
  render(s) {
    const middle =
      stSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle }) +
      stTargets({ cards: s.cards || [], ticks: s.ticks || [] });
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
