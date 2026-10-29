// Template: core/cards-row-5-photo — header + five photo cards in a row.
// Source Figma frame 109:5099.
import { frame, pageHeader } from "../frame.js";
import { cardGrid, SAMPLE } from "../blocks.js";

const ex = (n) => SAMPLE.slice(0, n).map((image) => ({
  image, title: "Title", subtitle: "Subtitle",
  body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
}));

export default {
  name: "core/cards-row-5-photo",
  slide: 24,
  figmaNode: "109:5099",
  family: "core", role: "cards", shape: "row", count: 5, theme: "light", chrome: false,
  use: "Five photo cards in a row — each with a photo, title, subtitle and short body.",
  media: ["photo"],
  capacity: { items: 5, min: 4, max: 5 },
  slots: { images: 5, titles: 5, subtitles: 5, body: 5, stats: 0, icons: 0 },
  description: "core/cards-row-5-photo — header + intro, then five photo cards in a row.",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    cards: "array of 5 {image, title, subtitle, body}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section",
    cards: ex(5),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "95" },
  },
  render(s) {
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      cardGrid((s.cards || []).slice(0, 5), 5);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
