// Switch: track (control) hugging the thumb, and the label. The thumb sits at the end while checked.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', align: 'CENTER' }, 'component');
  const control = h.frame('control', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'AUTO', justify: v.checked === 'true' ? 'MAX' : 'MIN', align: 'CENTER', fill: true, stroke: true });
  control.resize(36, 20);
  const thumb = h.frame('thumb', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', fill: true });
  thumb.resize(14, 14);
  control.appendChild(thumb);
  c.appendChild(control);
  c.appendChild(h.text('label', 'Label'));
  return c;
}

async function afterSet(set) {
  const label = set.addComponentProperty('Label', 'TEXT', 'Label');
  const show = set.addComponentProperty('Show label', 'BOOLEAN', true);
  for (const c of set.children) c.findChild((n) => n.name === 'label').componentPropertyReferences = { characters: label, visible: show };
}
