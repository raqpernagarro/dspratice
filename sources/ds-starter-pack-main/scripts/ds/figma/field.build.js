// Field: label, an Input instance of the same size, description and error message, stacked.
// The Control slot holds an Input that follows the Field's Size and Invalid; its own look comes from Input.
async function buildVariant(v, h, props) {
  const input = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Input');
  if (!input) throw new Error('Build Input first');
  const variant = input.children.find((c) => {
    const p = c.variantProperties;
    return p.Size === props.Size && p.State === 'Default' && p.Filled === 'False' && p.Invalid === props.Invalid;
  });
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN' }, 'component');
  c.resize(240, 100);
  c.primaryAxisSizingMode = 'AUTO'; // resize() fixes both axes: hug the content again.
  c.appendChild(h.text('label', 'Label'));
  // A slot: designers swap in a Select, Combobox, Number Field, … (preferred values).
  const slot = h.slot(c, 'Control', { direction: 'VERTICAL' });
  c.appendChild(slot);
  const control = variant.createInstance();
  control.name = 'control';
  slot.appendChild(control);
  control.layoutAlign = 'STRETCH';
  c.appendChild(h.text('description', 'Description'));
  const error = h.text('error', 'Error message');
  c.appendChild(error);
  // The error replaces the description while invalid.
  error.visible = v.invalid === 'true';
  c.findChild((n) => n.name === 'description').visible = v.invalid !== 'true';
  for (const n of c.children) n.layoutAlign = 'STRETCH';
  return c;
}

// Text and visibility properties, like Button's.
async function afterSet(set) {
  const label = set.addComponentProperty('Label', 'TEXT', 'Label');
  const description = set.addComponentProperty('Description', 'TEXT', 'Description');
  const showDescription = set.addComponentProperty('Show description', 'BOOLEAN', true);
  const error = set.addComponentProperty('Error', 'TEXT', 'Error message');
  for (const c of set.children) {
    c.findChild((n) => n.name === 'label').componentPropertyReferences = { characters: label };
    // Show description only drives the valid variants; invalid ones always show the error instead.
    const invalid = c.variantProperties.Invalid === 'True';
    c.findChild((n) => n.name === 'description').componentPropertyReferences = invalid ? { characters: description } : { characters: description, visible: showDescription };
    c.findChild((n) => n.name === 'error').componentPropertyReferences = { characters: error };
  }
}
