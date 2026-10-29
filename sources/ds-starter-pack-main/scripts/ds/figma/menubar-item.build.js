// Menubar Item: a text button.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'AUTO', counter: 'FIXED', align: 'CENTER', fill: true }, 'component');
  c.resize(40, 32);
  c.appendChild(h.text('label', 'File'));
  return c;
}

async function afterSet(set) {
  const label = set.addComponentProperty('Label', 'TEXT', 'File');
  for (const c of set.children) c.findChild((n) => n.name === 'label').componentPropertyReferences = { characters: label };
}
