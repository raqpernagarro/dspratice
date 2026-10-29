// Template: core/gallery-grid-8-photo — renamed to core/gallery-wall-card (the old name did not describe
// the layout). Kept registered, retired, so the saved decks that use this name
// still render; never offered for new slides.
import live from "./core-gallery-wall-card.js";

const { intent, ...rest } = live;
export default { ...rest, name: "core/gallery-grid-8-photo", replacedBy: "core/gallery-wall-card" };
