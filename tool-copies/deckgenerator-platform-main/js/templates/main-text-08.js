// Template: main/text-08 — renamed to main/chart-03: it is a chart, but the Figma frame
// name put it in the "text" series. Kept registered, retired, so saved decks
// that use this name still render; never offered for new slides.
import live from "./main-chart-03.js";

const { intent, ...rest } = live;
export default { ...rest, name: "main/text-08", replacedBy: "main/chart-03" };
