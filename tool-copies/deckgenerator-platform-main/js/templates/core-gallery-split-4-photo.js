// Template: core/gallery-split-4-photo — renamed to core/gallery-split-photo-stack
// (it shows three photos, not four). Kept registered, retired, so the saved decks
// that use this name still render; never offered for new slides.
import live from "./core-gallery-split-photo-stack.js";

const { intent, ...rest } = live;
export default { ...rest, name: "core/gallery-split-4-photo", replacedBy: "core/gallery-split-photo-stack" };
