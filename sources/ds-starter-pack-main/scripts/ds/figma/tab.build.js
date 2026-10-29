// Tab: a text button. The selected one draws the indicator (surface, border on three sides, top
// corners rounded); in code Tabs.Indicator slides behind it.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'AUTO', counter: 'FIXED', justify: 'CENTER', align: 'CENTER', fill: true, stroke: true }, 'component');
  c.resize(80, 36);
  c.primaryAxisSizingMode = 'AUTO';
  c.strokeBottomWeight = 0;
  c.appendChild(h.text('label', 'Overview'));
  return c;
}
