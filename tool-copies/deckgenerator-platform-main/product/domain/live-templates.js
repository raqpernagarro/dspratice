// product/domain/live-templates.js
// =============================================================================
// The templates new content may use.
//
// A template is retired by giving it `replacedBy: "<family/slug>"` instead of
// deleting it: saved decks still reference retired names (portfolio/grid-14 was
// in three decks when it was retired as a duplicate of grid-09), and deleting
// the module would break those slides. A retired template keeps rendering for
// the decks that have it, and is never offered for anything new: not in layout
// choice, not on the Templates page, not as a swap target in the editor.
//
// Rendering and validating existing slides keep using the full registry
// (allTemplates); only choosing uses this list.
// =============================================================================
import { allTemplates } from "../../js/templates/index.js";

export const isLive = (t) => !t?.replacedBy;
export const liveTemplates = allTemplates.filter(isLive);
