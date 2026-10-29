// Progress: label and value over a track; the indicator's width follows Value.
const LABEL = "Export data";
async function buildVariant(v, h) {
  const VALUE = Number(v.value) / 100;
  const c = h.frame("", { direction: "VERTICAL", primary: "AUTO", counter: "FIXED", align: "MIN" }, "component");
  c.resize(240, 40);
  c.primaryAxisSizingMode = "AUTO";
  const header = h.frame("header", { direction: "HORIZONTAL", justify: "SPACE_BETWEEN", align: "CENTER" });
  header.appendChild(h.text("label", LABEL));
  header.appendChild(h.text("value", Math.round(VALUE * 100) + "%"));
  c.appendChild(header);
  header.layoutAlign = "STRETCH";
  header.primaryAxisSizingMode = "FIXED";
  const track = h.frame("track", { direction: "HORIZONTAL", primary: "FIXED", counter: "FIXED", align: "MIN", fill: true });
  track.clipsContent = true;
  c.appendChild(track);
  track.layoutAlign = "STRETCH";
  const indicator = h.frame("indicator", { direction: "HORIZONTAL", primary: "FIXED", counter: "FIXED", fill: true });
  // A frame can't be 0 wide: at 0% the indicator is a hairline.
  indicator.resize(Math.max(0.01, Math.round(240 * VALUE)), 4);
  track.appendChild(indicator);
  indicator.layoutAlign = "STRETCH";
  return c;
}
