// Template: creative/grid-30 — step 3 of the imagery-principles progressive-focus sequence
// (grid-28..31): the same four feature cards with card 3 highlighted. Source frame 7:1901.
import { imagerySlide } from "./creative-grid-28.js";

export default {
  name: "creative/grid-30", slide: 222, figmaNode: "7:1901",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "An imagery-principles slide: page header + four feature cards, card 3 highlighted.",
  media: ["photo", "text"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 4, body: 4, stats: 0, icons: 0 },
  description: "creative/grid-30 — imagery principles, four feature cards (step 3 of 4).",
  schema: { meta: "{ studio, name, page }", header: "{ caption, title, subtitle, intro }", cards: "[{ title, body, i }]", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) { return imagerySlide(s, 2); },
};
