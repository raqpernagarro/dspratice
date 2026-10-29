// Template: core/gallery-grid-6-photo — renamed to core/gallery-wall-focus (the old name did not describe
// the layout). Kept registered, retired, so the saved decks that use this name
// still render; never offered for new slides.
import live from "./core-gallery-wall-focus.js";

const { intent, ...rest } = live;
export default { ...rest, name: "core/gallery-grid-6-photo", replacedBy: "core/gallery-wall-focus" };
