// Menu Item: indicator slot (checkbox / radio) › icon, label, caret (submenu).
// Every variant has every layer; the ones a type doesn't use are hidden, like in code.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', align: 'CENTER', fill: true }, 'component');
  c.resize(220, 36);
  const indicator = h.frame('indicator', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', justify: 'CENTER', align: 'CENTER' });
  indicator.resize(16, 16);
  const icon = v.type === 'radio' ? h.icon('Circle', 'Format=Stroke, Weight=Fill') : h.icon('Check', 'Format=Outline, Weight=Bold');
  icon.name = 'icon';
  icon.visible = v.checked === 'true';
  indicator.appendChild(icon);
  indicator.visible = v.type === 'checkbox' || v.type === 'radio';
  c.appendChild(indicator);
  const label = h.text('label', 'Menu item');
  c.appendChild(label);
  label.layoutGrow = 1;
  const caret = h.icon('CaretRight', 'Format=Stroke, Weight=Fill');
  caret.name = 'caret';
  caret.visible = v.type === 'submenu';
  c.appendChild(caret);
  return c;
}

async function afterSet(set) {
  const label = set.addComponentProperty('Label', 'TEXT', 'Menu item');
  for (const c of set.children) c.findChild((n) => n.name === 'label').componentPropertyReferences = { characters: label };
}
