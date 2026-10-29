// Template: main/logos-06 — renamed to main/chart-01: it is a chart, but the Figma frame
// name put it in the "logos" series. Kept registered, retired, so saved decks
// that use this name still render; never offered for new slides.
import live from "./main-chart-01.js";

const { intent, ...rest } = live;
export default { ...rest, name: "main/logos-06", replacedBy: "main/chart-01" };
