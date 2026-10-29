// Template: creative/text-08 — step 3 of the labeled-pair reveal (text-06..08): the left
// panel ("Lifestyle") is highlighted and the right is muted. Source frame 7:2183.
import { pairSlide } from "./creative-text-06.js";

export default {
  name: "creative/text-08", slide: 226, figmaNode: "7:2183",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "Two labeled photo panels with the left panel highlighted.",
  media: ["photo", "text"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 2, body: 0, stats: 0, icons: 0 },
  description: "creative/text-08 — labeled photo pair, left panel highlighted.",
  schema: { meta: "{ studio, name, page }", header: "{ caption, title }", labels: "[label, label]", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) { return pairSlide(s, 0); },
};
