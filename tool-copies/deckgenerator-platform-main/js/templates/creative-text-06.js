// Template: creative/text-06 — two large labeled photo panels ("Lifestyle" / "Product")
// under a page header. First of a three-step reveal (text-06..08); here both panels are
// active. Source frame 7:1931.
import { frame, pageHeader, footerBar } from "../frame.js";
import { crLabeledPair } from "../creative-blocks.js";

export const PAIR_HEAD = { caption: "Creative Direction", title: "Principles" };
export const PAIR_LABELS = ["Lifestyle", "Product"];
export const pairSlide = (s, active) => frame(
  pageHeader({ ...PAIR_HEAD, ...(s.header || {}) }) +
    crLabeledPair(s.labels || PAIR_LABELS, active),
  { meta: s.meta, footer: s.footer },
);

export default {
  name: "creative/text-06", slide: 224, figmaNode: "7:1931",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "Two large labeled photo panels under a page header (both active).",
  media: ["photo", "text"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 2, body: 0, stats: 0, icons: 0 },
  description: "creative/text-06 — labeled photo pair, Lifestyle + Product (both active).",
  schema: { meta: "{ studio, name, page }", header: "{ caption, title }", labels: "[label, label]", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) { return pairSlide(s, -1); },
};
