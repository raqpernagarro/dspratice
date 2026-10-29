// Navigation Menu Item: icon (line while inactive, filled while active), label, caret (triggers only;
// turned over while open).
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'AUTO', counter: 'FIXED', align: 'CENTER', fill: true }, 'component');
  c.resize(100, 36);
  const icon = h.icon('House', v.active === 'true' ? 'Format=Stroke, Weight=Fill' : 'Format=Outline, Weight=Regular');
  icon.name = 'icon';
  c.appendChild(icon);
  c.appendChild(h.text('label', 'Overview'));
  const caret = h.icon('CaretDown', 'Format=Stroke, Weight=Fill');
  caret.name = 'caret';
  caret.visible = v.type === 'trigger';
  if (v.active === 'true') caret.rotation = 180;
  c.appendChild(caret);
  return c;
}

// Label and Show icon. No icon swap property: each variant holds its own weight (line / fill), so
// swap the icon on the instance, picking the weight that matches Active.
async function afterSet(set) {
  const label = set.addComponentProperty('Label', 'TEXT', 'Overview');
  const show = set.addComponentProperty('Show icon', 'BOOLEAN', true);
  for (const c of set.children) {
    c.findChild((n) => n.name === 'label').componentPropertyReferences = { characters: label };
    c.findChild((n) => n.name === 'icon').componentPropertyReferences = { visible: show };
  }
}
