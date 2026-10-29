// Template: core/cards-grid-8-photo-alt — a full-bleed staggered photo wall:
// four columns of photos running off the top and bottom. No chrome. Source
// Figma frame 109:5196.
import { coreWall, SAMPLE } from "../blocks.js";

export default {
  name: "core/cards-grid-8-photo-alt",
  slide: 27,
  figmaNode: "109:5196",
  family: "core", role: "cards", shape: "grid", count: 8, theme: "light", chrome: false,
  use: "A full-bleed staggered wall of photos, no text — a mood or culture break.",
  media: ["photo"],
  capacity: { items: 12, min: 4, max: 12 },
  slots: { images: 12, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "core/cards-grid-8-photo-alt — full-bleed staggered photo wall, photos only.",
  schema: {
    images: "array of up to 12 photo paths (fewer repeat to fill the wall)",
  },
  example: {
    images: SAMPLE.slice(0, 12),
  },
  render(s) {
    // Figma 109:5196: the full-bleed staggered photo wall, every photo plain
    // (the same wall as core/gallery-wall-card and -focus, without the card or
    // the fade). No chrome.
    const images = s.images || (s.cards || []).map((c) => c.image).filter(Boolean);
    return `<div class="v2f-root">${coreWall(images)}</div>`;
  },
};
