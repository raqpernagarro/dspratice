// Template: core/cards-row-4-photo — header + four photo cards in a row.
// Source Figma frame 109:5085.
import { frame, pageHeader } from "../frame.js";
import { cardGrid, SAMPLE } from "../blocks.js";

const ex = (n) => SAMPLE.slice(0, n).map((image) => ({
  image, title: "Title", subtitle: "Subtitle",
  body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
}));

export default {
  name: "core/cards-row-4-photo",
  slide: 23,
  figmaNode: "109:5085",
  family: "core", role: "cards", shape: "row", count: 4, theme: "light", chrome: false,
  use: "Four photo cards in a row — each with a photo, title, subtitle and short body.",
  media: ["photo"],
  capacity: { items: 4, min: 3, max: 4 },
  slots: { images: 4, titles: 4, subtitles: 4, body: 4, stats: 0, icons: 0 },
  description: "core/cards-row-4-photo — header + intro, then four photo cards in a row.",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    cards: "array of 4 {image, title, subtitle, body}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section",
    cards: ex(4),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "94" },
  },
  render(s) {
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      cardGrid((s.cards || []).slice(0, 4), 4);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
