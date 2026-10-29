// Radio: the circle (control) holding the dot (indicator, only while checked), and the label.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', align: 'CENTER' }, 'component');
  const control = h.frame('control', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', justify: 'CENTER', align: 'CENTER', fill: true, stroke: true });
  control.resize(16, 16);
  const dot = h.frame('indicator', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', fill: true });
  dot.resize(8, 8);
  dot.visible = v.checked === 'true';
  control.appendChild(dot);
  c.appendChild(control);
  c.appendChild(h.text('label', 'Label'));
  return c;
}

async function afterSet(set) {
  const label = set.addComponentProperty('Label', 'TEXT', 'Label');
  for (const c of set.children) c.findChild((n) => n.name === 'label').componentPropertyReferences = { characters: label };
}
