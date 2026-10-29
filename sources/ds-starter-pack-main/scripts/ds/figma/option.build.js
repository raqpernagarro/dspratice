// Option: indicator slot › check (only while selected), label. Same structure as Menu Item.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', align: 'CENTER', fill: true }, 'component');
  c.resize(220, 36);
  const indicator = h.frame('indicator', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', justify: 'CENTER', align: 'CENTER' });
  indicator.resize(16, 16);
  const icon = h.icon('Check', 'Format=Outline, Weight=Bold');
  icon.name = 'icon';
  icon.visible = v.selected === 'true';
  indicator.appendChild(icon);
  c.appendChild(indicator);
  const label = h.text('label', 'Option');
  c.appendChild(label);
  label.layoutGrow = 1;
  return c;
}

// Label text, and Show indicator (off for Autocomplete's suggestions).
async function afterSet(set) {
  const label = set.addComponentProperty('Label', 'TEXT', 'Option');
  const show = set.addComponentProperty('Show indicator', 'BOOLEAN', true);
  for (const c of set.children) {
    c.findChild((n) => n.name === 'label').componentPropertyReferences = { characters: label };
    c.findChild((n) => n.name === 'indicator').componentPropertyReferences = { visible: show };
  }
}
