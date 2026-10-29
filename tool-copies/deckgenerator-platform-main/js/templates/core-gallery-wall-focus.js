// Template: core/gallery-wall-focus — a full-bleed staggered photo wall where
// every photo but one is faded, so a single image stands out. Source frame
// 109:5215. No chrome.
// Named core/gallery-grid-6-photo in Figma; renamed here because that name did not describe it.
import { coreWall, SAMPLE } from "../blocks.js";

export default {
  name: "core/gallery-wall-focus",
  slide: 41,
  figmaNode: "109:5215",
  family: "core", role: "gallery", shape: "grid", count: 12, theme: "light", chrome: false,
  use: "A full-bleed staggered photo wall, faded, with one photo in focus.",
  media: ["photo"],
  capacity: { items: 12, min: 4, max: 12 },
  slots: { images: 12, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "core/gallery-wall-focus — faded staggered photo wall, one photo in focus.",
  intent: {
    bestFor: ["singling out one picture — a person, product or moment — from a larger body of work"],
    holds: "photos only, no text; the fifth photo is the one in focus",
    avoid: ["any slide that has to say something in words"],
    feel: "visual",
    needs: ["photo"],
  },
  schema: {
    images: "array of up to 12 photo paths (fewer repeat to fill the wall); the 5th is shown in focus",
  },
  example: {
    images: SAMPLE.slice(0, 12),
  },
  render(s) {
    // Column 2, row 2 is the focus tile; with columns filled top-to-bottom it
    // is the fifth image (col 1 takes 0–2, col 2 takes 3–5, the hero is 4).
    return `<div class="v2f-root">${coreWall(s.images || [], { focus: true })}</div>`;
  },
};
