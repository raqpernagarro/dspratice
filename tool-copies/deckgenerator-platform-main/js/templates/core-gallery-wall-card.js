// Template: core/gallery-wall-card — a full-bleed staggered photo wall (four
// columns bleeding off the top and bottom) with one dark text card set into it.
// Source frame 109:5234. No chrome.
// Named core/gallery-grid-8-photo in Figma; renamed here because that name did not describe it.
import { coreWall, SAMPLE } from "../blocks.js";

export default {
  name: "core/gallery-wall-card",
  slide: 42,
  figmaNode: "109:5234",
  family: "core", role: "gallery", shape: "grid", count: 11, theme: "light", chrome: false,
  use: "A full-bleed staggered photo wall with one dark text card set into it.",
  media: ["photo"],
  capacity: { items: 11, min: 4, max: 11 },
  slots: { images: 11, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/gallery-wall-card — staggered full-bleed photo wall + one dark text card.",
  intent: {
    bestFor: ["culture, people or a body of work shown as many pictures, with one short caption",
      "a mood-setting break between sections"],
    holds: "a short title and a paragraph of up to about 240 characters on the card; 4–11 photos",
    itemChars: 260,
    avoid: ["anything where the reader must read more than one short paragraph", "data or lists"],
    feel: "visual",
    needs: ["photo"],
  },
  schema: {
    title: "string — the card's title", body: "string — the card's paragraph",
    images: "array of up to 11 photo paths (fewer repeat to fill the wall)",
  },
  example: {
    title: "Title",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    images: SAMPLE.slice(0, 11),
  },
  render(s) {
    return `<div class="v2f-root">${coreWall(s.images || [], { card: { title: s.title, body: s.body } })}</div>`;
  },
};
