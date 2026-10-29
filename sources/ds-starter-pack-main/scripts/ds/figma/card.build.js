// Card: header (title, description) › Body slot (any content) › Footer slot (a Button), 320 wide.
async function buildVariant(v, h) {
  const buttonSet = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Button');
  if (!buttonSet) throw new Error('Build Button first');
  const c = h.frame('', { direction: 'VERTICAL', align: 'MIN', fill: true, stroke: true, width: 320 }, 'component');
  c.counterAxisSizingMode = 'FIXED';
  const header = h.frame('header', { direction: 'VERTICAL', align: 'MIN' });
  c.appendChild(header);
  header.layoutAlign = 'STRETCH';
  header.appendChild(h.text('title', 'Starter plan'));
  const description = h.text('description', 'For small teams getting started.');
  header.appendChild(description);
  description.layoutAlign = 'STRETCH';
  description.textAutoResize = 'HEIGHT';
  const body = h.slot(c, 'Body', { direction: 'VERTICAL' });
  c.appendChild(body);
  body.layoutAlign = 'STRETCH';
  const text = h.text('text', 'Up to 5 projects and 10 GB of storage.');
  body.appendChild(text);
  text.layoutAlign = 'STRETCH';
  text.textAutoResize = 'HEIGHT';
  const footer = h.slot(c, 'Footer', { direction: 'HORIZONTAL', justify: 'MAX', align: 'CENTER' });
  c.appendChild(footer);
  footer.layoutAlign = 'STRETCH';
  footer.primaryAxisSizingMode = 'FIXED'; // span the card, so the button sits on the right
  const button = buttonSet.children.find((x) => { const p = x.variantProperties; return p.Type === 'Primary' && p.Size === 'Small' && p.State === 'Default' && p.Destructive === 'False'; }).createInstance();
  button.name = 'button';
  const label = Object.keys(button.componentProperties).find((k) => k.startsWith('Text#'));
  const props = Object.fromEntries(Object.keys(button.componentProperties).filter((k) => /^Show (Lead|Trail)#/.test(k)).map((k) => [k, false]));
  if (label) props[label] = 'Choose plan';
  button.setProperties(props);
  footer.appendChild(button);
  return c;
}
