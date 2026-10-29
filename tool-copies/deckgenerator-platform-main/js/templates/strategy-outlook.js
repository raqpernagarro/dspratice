// Template: strategy/grid-01 — "Outlook": a split head (title + right body) over a
// row of growing timeline boxes. Light theme. Source Figma frame 109:8805.
import { frame } from "../frame.js";
import { stSplitHead, stGrowBoxes } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-01",
  slide: 142,
  figmaNode: "109:8805",
  family: "strategy",
  role: "diagram",
  shape: "timeline",
  theme: "light",
  chrome: false,
  use: "A long-range outlook: a row of horizon markers (Today → future years) drawn as boxes that grow with distance, introduced by a title + body paragraph.",
  media: [],
  capacity: { items: 4, min: 3, max: 5 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "strategy/grid-01 — split head + a growing-box horizon timeline.",
  intent: { bestFor: ["a long-range outlook across time horizons (Today, 2030, 2040)"], holds: "3–5 horizon labels with an intro paragraph", itemChars: 12, avoid: ["a schedule of dated tasks or milestones (use a timeline)", "risks, owners or decisions", "near-term dates — the boxes grow with distance and read as growth"], feel: "visual", needs: [] },
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    body: "string — intro paragraph",
    items: "array of horizon labels (Today, 2030 …)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Outlook", subtitle: "Subtitle",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    items: ["Today", "2030", "2040", "2050"],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "146" },
  },
  render(s) {
    const middle =
      stSplitHead({ caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body }) +
      stGrowBoxes(s.items || []);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
