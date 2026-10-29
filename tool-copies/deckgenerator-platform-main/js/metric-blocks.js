// =============================================================================
// Metric and MetricCard — the HTML twins of the Figma components "Metric"
// (112:78042) and "MetricCard" (112:78070) on the Master-Slides "--> Metric"
// page. Option names mirror the Figma properties one to one, so a slide built
// in Figma maps straight onto these calls. Used by the pitch and marketing
// templates; CSS is `.v2f-metric*` / `.v2f-mcard*` in css/primitives.css.
// Class names are BEM-style on purpose: the app's own CSS styles bare names
// like `.card`, `.edge` or `.nav` (see CLAUDE.md).
// =============================================================================
import { esc } from "./components.js";
import { icon as brandIcon } from "./icons.js";

/**
 * Metric — a number with its label.
 *   style:    "standard" (value, label under it) | "eyebrow" (small label above the value)
 *   size:     "large" | "medium" | "small"   (eyebrow: large | medium)
 *   emphasis: "value" | "label"              (which line carries the weight)
 *   align:    "left" | "center"
 *   showLabel: boolean (default true)
 */
export const metric = ({ label, value } = {}, { style = "standard", size = "medium", emphasis = "value", align = "left", showLabel = true } = {}) => {
  const lab = showLabel && label != null && label !== "" ? `<p class="v2f-metric__label">${esc(label)}</p>` : "";
  const val = `<p class="v2f-metric__value">${esc(value ?? "")}</p>`;
  return `<div class="v2f-metric v2f-metric--${style} v2f-metric--${size} v2f-metric--em-${emphasis} v2f-metric--${align}">${style === "eyebrow" ? lab + val : val + lab}</div>`;
};

/**
 * MetricCard — a key figure on a tinted card.
 *   layout: "statement" — a sentence whose first part is highlighted (value + text)
 *           "single"    — one eyebrow Metric (label, value) and an optional description
 *           "multiple"  — a title, two eyebrow Metrics and a description
 *   size:   "default" | "large"   (large: the single Metric at 150px, description pinned to the foot)
 *   showTitle / showDescription / showIcon, icon (a name from js/icons.js)
 *   tone:   the card fill for a statement card; the Figma slides override it per
 *           instance — "t20" (component default), "t25", "t50", "t75", "t100".
 * Content: { value, text } for statements; { label, value, description } for
 * single; { title, metrics: [{label, value}, {label, value}], description } for multiple.
 */
export const metricCard = (c = {}, { layout = "single", size = "default", showTitle = true, showDescription = true, showIcon = false, icon = "", tone = "t20", cls = "" } = {}) => {
  const ic = showIcon && icon ? `<span class="v2f-mcard__icon">${brandIcon(icon)}</span>` : "";
  const desc = showDescription && c.description ? `<p class="v2f-mcard__desc">${esc(c.description)}</p>` : "";
  let body = "";
  if (layout === "statement") {
    body = `<p class="v2f-mcard__statement"><span class="v2f-mcard__hl">${esc(c.value ?? "")} </span><span class="v2f-mcard__rest">${esc(c.text ?? "")}</span></p>`;
  } else if (layout === "multiple") {
    const ms = (c.metrics || []).slice(0, 2).map((m) => metric(m, { style: "eyebrow", size: "medium" })).join("");
    body = `${showTitle && c.title ? `<p class="v2f-mcard__title">${esc(c.title)}</p>` : ""}<div class="v2f-mcard__stats">${ms}</div>${desc}`;
  } else {
    body = metric({ label: c.label, value: c.value }, { style: "eyebrow", size: size === "large" ? "large" : "medium" }) + desc;
  }
  return `<div class="v2f-mcard v2f-mcard--${layout} v2f-mcard--${size}${layout === "statement" ? ` v2f-mcard--${tone}` : ""}${cls ? " " + cls : ""}">${ic}${body}</div>`;
};
