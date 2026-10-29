// Badge: a pill holding its label. Height, padding, colors and text style come from the bindings.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', align: 'CENTER', justify: 'CENTER', fill: true, stroke: true }, 'component');
  c.appendChild(h.text('label', 'Badge'));
  return c;
}
