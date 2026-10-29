// Template: creative/grid-28 — an "imagery principles" slide: a page header over a row of
// four feature cards (title + body over an image). First of a four-step progressive-focus
// sequence (grid-28..31), so card 1 is highlighted and the rest are muted. Frame 7:1869.
import { frame, pageHeader, footerBar } from "../frame.js";
import { crFeatureCards } from "../creative-blocks.js";

// Shared page header + card content for the grid-28..31 sequence.
export const IMAGERY_HEAD = {
  caption: "Creative Direction", title: "Imagery", subtitle: "Principles",
  intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor " +
    "incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud " +
    "exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
};
export const IMAGERY_CARDS = [
  { title: "Principle 1" }, { title: "Principle 2" },
  { title: "Principle 3" }, { title: "Principle 4" },
];
export const imagerySlide = (s, active) => frame(
  pageHeader({ ...IMAGERY_HEAD, ...(s.header || {}) }) +
    crFeatureCards(s.cards || IMAGERY_CARDS, active),
  { meta: s.meta, footer: s.footer },
);

export default {
  name: "creative/grid-28", slide: 220, figmaNode: "7:1869",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "An imagery-principles slide: page header + four feature cards, card 1 highlighted.",
  media: ["photo", "text"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 4, body: 4, stats: 0, icons: 0 },
  description: "creative/grid-28 — imagery principles, four feature cards (step 1 of 4).",
  schema: { meta: "{ studio, name, page }", header: "{ caption, title, subtitle, intro }", cards: "[{ title, body, i }]", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) { return imagerySlide(s, 0); },
};
