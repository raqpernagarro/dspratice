// js/chart-scale.js
// =============================================================================
// The vertical range a hand-built chart should draw over.
//
// This exists because the same bug was written twice, in two families, and
// found twice by different means. Both finLineChart and stLineChart plotted
// against a zero-based axis whose ceiling came from the TEMPLATE — the dollar
// scale of its own Figma example, 700 in one case and 5600 in the other. Given
// real data on a different scale (availability between 87.9% and 89.1%; a
// percentage series beside a figure series) every point and every tick label
// landed in a thin band and the axis rendered as one stack of overlapping
// labels. Nothing clipped, nothing escaped the frame, contrast was fine.
//
// One implementation, so a third chart cannot drift from the other two.
// =============================================================================

/**
 * Chooses the [lo, hi] a chart should map onto its plot height.
 *
 * An explicit ceiling is honoured only when the data actually reaches into it,
 * which keeps the zero-based axis the finance examples are drawn around. When
 * it does not, the range is fitted to the values with padding, and zero is
 * pulled in when it is close enough to be worth showing.
 *
 * @param {number[]} values  every plotted value
 * @param {number[]} [ticks] label values, which must also fit on the axis
 * @param {number|null} [ceiling] the template's declared maximum, if any
 * @returns {{lo: number, hi: number}} always with hi > lo
 */
export function chartRange(values = [], ticks = [], ceiling = null) {
  const pool = [...values, ...ticks].map(Number).filter(Number.isFinite);
  if (!pool.length) return { lo: 0, hi: 1 };

  const dataHi = Math.max(...pool);
  const dataLo = Math.min(...pool);

  // The data uses the given axis: keep it, so the examples render unchanged.
  if (ceiling && dataHi <= ceiling && dataHi >= ceiling * 0.35) {
    return { lo: 0, hi: ceiling };
  }

  const span = dataHi - dataLo;
  const pad = span ? span * 0.15 : Math.abs(dataHi) * 0.1 || 1;
  let lo = dataLo - pad;
  let hi = dataHi + pad;

  // Zero belongs on the axis when it is already nearly in view.
  if (lo > 0 && lo <= (hi - lo) * 0.25) lo = 0;
  if (hi < 0 && hi >= -(hi - lo) * 0.25) hi = 0;
  if (hi <= lo) hi = lo + 1;
  return { lo, hi };
}
