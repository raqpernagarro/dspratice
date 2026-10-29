// Template: strategy/grid-12 — "Projection": an upward growth curve from a start
// node to a bullet list, over a month timeline. Full-width, light theme.
// Source Figma frame 109:9064 (Strategy).
import { frame } from "../frame.js";
import { stSplitHead, stProjectionChart, stMonthTimeline } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-12",
  slide: 154,
  figmaNode: "109:9064",
  family: "strategy",
  role: "diagram",
  shape: "projection",
  theme: "light",
  chrome: false,
  use: "A growth projection: a curve rising from a starting point to a set of future outcomes, anchored to a labelled month timeline.",
  media: [],
  capacity: { items: 5, min: 3, max: 6 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "strategy/grid-12 — an upward projection curve → bullets over a month timeline.",
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    name: "string — start node label", bullets: "array of outcome strings",
    months: "array of { label, text, active }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Projection", subtitle: "Subtitle",
    name: "Name",
    bullets: ["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"],
    months: [
      { label: "Month", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      { label: "Month", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", active: true },
      { label: "Month", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      { label: "Month", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      { label: "Month", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "158" },
  },
  render(s) {
    const middle =
      stSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle }) +
      stProjectionChart({ name: s.name, bullets: s.bullets || [] }) +
      stMonthTimeline(s.months || []);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
