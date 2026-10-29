// Template: creative/grid-31 — step 4 (final) of the imagery-principles progressive-focus
// sequence (grid-28..31): the same four feature cards with card 4 highlighted. Frame 7:1921.
import { imagerySlide } from "./creative-grid-28.js";

export default {
  name: "creative/grid-31", slide: 223, figmaNode: "7:1921",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "An imagery-principles slide: page header + four feature cards, card 4 highlighted.",
  media: ["photo", "text"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 4, body: 4, stats: 0, icons: 0 },
  description: "creative/grid-31 — imagery principles, four feature cards (step 4 of 4).",
  schema: { meta: "{ studio, name, page }", header: "{ caption, title, subtitle, intro }", cards: "[{ title, body, i }]", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) { return imagerySlide(s, 3); },
};
