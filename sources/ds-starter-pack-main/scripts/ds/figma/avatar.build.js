// Avatar: a clipped circle holding the picture (Type = Image) or the initials (Type = Initials).
// The picture is a placeholder gradient; designers swap in a real image fill.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', justify: 'CENTER', align: 'CENTER', fill: true }, 'component');
  c.resize(36, 36);
  c.clipsContent = true;
  const image = h.frame('image', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED' });
  image.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { r: 0.99, g: 0.83, b: 0.3, a: 1 } }, { position: 1, color: { r: 0.96, g: 0.45, b: 0.71, a: 1 } }] }];
  c.appendChild(image);
  image.layoutPositioning = 'ABSOLUTE';
  image.resize(36, 36);
  image.x = 0;
  image.y = 0;
  image.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  image.visible = v.type === 'image';
  const initials = h.text('fallback', 'LT');
  c.appendChild(initials);
  initials.visible = v.type === 'initials';
  return c;
}

async function afterSet(set) {
  const initials = set.addComponentProperty('Initials', 'TEXT', 'LT');
  for (const c of set.children) c.findChild((n) => n.name === 'fallback').componentPropertyReferences = { characters: initials };
}
