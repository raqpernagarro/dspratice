// Template: planning/data-03 — a row of four profile cards (photo + name + title +
// note). Source Figma frame 105:3609.
import { frame } from "../frame.js";
import { plProfileCards, plAvatar } from "../planning-blocks.js";

export default {
  name: "planning/data-03", slide: 174, figmaNode: "105:3609",
  family: "planning", role: "team", shape: "row", theme: "light", chrome: false,
  use: "A row of four profile cards — a portrait over a name, title and short note.",
  media: ["photo"], capacity: { items: 4, min: 3, max: 4 },
  slots: { images: 4, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "planning/data-03 — four full-height profile cards.",
  intent: { bestFor: ["four people of the presenting team with a short note each"], holds: "3–4 people, each a name, title and short note", itemChars: 60, avoid: ["a client's roles or job titles", "risks, owners or workstreams", "interview or research participants", "quotes from people outside the team — the photos show Nagarro people and would be read as them"], feel: "visual", needs: ["portrait photos of the team"] },
  schema: {
    cards: "array of { image, name, title, body }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    cards: Array(4).fill(0).map((_, i) => ({ image: plAvatar(i), name: "Name", title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "77" },
  },
  render(s) {
    return frame(plProfileCards(s.cards || []), { meta: s.meta, footer: s.footer });
  },
};
