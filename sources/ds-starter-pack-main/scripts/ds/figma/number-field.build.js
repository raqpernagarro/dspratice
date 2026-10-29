// Number Field: a box like Input's with − / value / + segments (dividers are the segments' side strokes).
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', align: 'CENTER', fill: true, stroke: true }, 'component');
  c.resize(128, 36);
  c.clipsContent = true;
  const step = (name, glyph) => {
    const s = h.frame(name, { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'AUTO', justify: 'CENTER', align: 'CENTER', fill: true, stroke: true });
    s.resize(36, 36);
    s.strokeTopWeight = 0; s.strokeBottomWeight = 0;
    if (name === 'decrement') s.strokeLeftWeight = 0; else s.strokeRightWeight = 0;
    const icon = h.icon(glyph, 'Format=Outline, Weight=Bold');
    icon.name = 'icon';
    s.appendChild(icon);
    return s;
  };
  c.appendChild(step('decrement', 'Minus'));
  const value = h.text('value', '100');
  value.textAlignHorizontal = 'CENTER';
  value.textAlignVertical = 'CENTER';
  c.appendChild(value);
  value.layoutGrow = 1;
  c.appendChild(step('increment', 'Plus'));
  for (const n of c.children) n.layoutAlign = 'STRETCH';
  return c;
}
