// A template example as a model would hand it back: every prose value
// rewritten, structure and image paths untouched. Stubs that returned the raw
// example were testing a model that copies the sample slide — which the engine
// now rejects (exampleEcho), so they need to write their own words like a real
// one does.
const ASSET = /^(assets\/|\/assets\/|https?:\/\/)|\.(jpe?g|png|svg|webp|gif)$/i;
// Inside list rows every word is the model's own (a chart's "Q1 24" and
// "$120M" are data, however short); at the top level only prose is rewritten.
const rowTag = (i) => (i < 26 ? "" : rowTag(Math.floor(i / 26) - 1)) + String.fromCharCode(97 + (i % 26));

export function written(value, tag = "written", inRow = false) {
  if (typeof value === "string") return (inRow || value.length >= 12) && value && !ASSET.test(value) ? `${value} (${tag})` : value;
  // Rows are tagged with letters, not digits: a digit here would be a figure
  // the material never gave, and the deck-wide figure check rightly strips it.
  if (Array.isArray(value)) return value.map((v, i) => written(v, `${tag} ${rowTag(i)}`, typeof v === "object"));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === "meta" || k === "footer" ? v : written(v, tag, inRow)]));
  }
  return value;
}
