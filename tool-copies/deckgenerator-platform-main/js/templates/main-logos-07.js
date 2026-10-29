// Template: main/logos-07 — renamed to main/chart-02: it is a chart, but the Figma frame
// name put it in the "logos" series. Kept registered, retired, so saved decks
// that use this name still render; never offered for new slides.
import live from "./main-chart-02.js";

const { intent, ...rest } = live;
export default { ...rest, name: "main/logos-07", replacedBy: "main/chart-02" };
