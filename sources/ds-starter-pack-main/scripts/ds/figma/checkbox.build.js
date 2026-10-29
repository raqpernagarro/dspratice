// Checkbox: the box (control) holding the indicator icon, and the label text.
// Layer names = the spec's part paths ('', 'control', 'control › indicator', 'label').
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', align: 'CENTER' }, 'component');
  const control = h.frame('control', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', justify: 'CENTER', align: 'CENTER', fill: true, stroke: true });
  control.resize(16, 16);
  const indicator = h.icon(v.checked === 'indeterminate' ? 'Minus' : 'Check', 'Format=Outline, Weight=Bold');
  indicator.name = 'indicator';
  // Base UI only renders the indicator while checked or indeterminate.
  indicator.visible = v.checked !== 'unchecked';
  control.appendChild(indicator);
  c.appendChild(control);
  c.appendChild(h.text('label', 'Label'));
  return c;
}

// Label text and Show label, like Field's.
async function afterSet(set) {
  const label = set.addComponentProperty('Label', 'TEXT', 'Label');
  const show = set.addComponentProperty('Show label', 'BOOLEAN', true);
  for (const c of set.children) c.findChild((n) => n.name === 'label').componentPropertyReferences = { characters: label, visible: show };
}
