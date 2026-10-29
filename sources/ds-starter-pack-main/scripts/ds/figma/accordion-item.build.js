// Accordion Item: divider (Show divider), trigger (label, plus / cross) and the Panel slot (shown
// while open). The plus is drawn as a cross (X) while open, as the code turns it 45°.
async function buildVariant(v, h) {
  const open = v.open === 'true';
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN' }, 'component');
  c.resize(320, 40);
  c.primaryAxisSizingMode = 'AUTO';
  const divider = h.frame('divider', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', fill: true });
  divider.resize(320, 1);
  c.appendChild(divider);
  divider.layoutAlign = 'STRETCH';
  const trigger = h.frame('trigger', { direction: 'HORIZONTAL', align: 'CENTER', fill: true });
  const label = h.text('label', 'What is Base UI?');
  trigger.appendChild(label);
  label.layoutGrow = 1;
  const icon = open ? h.icon('X', 'Format=Outline, Weight=Bold') : h.icon('Plus', 'Format=Outline, Weight=Bold');
  icon.name = 'icon';
  trigger.appendChild(icon);
  c.appendChild(trigger);
  trigger.layoutAlign = 'STRETCH';
  trigger.primaryAxisSizingMode = 'FIXED';
  const panel = h.slot(c, 'Panel', { direction: 'VERTICAL' });
  const text = h.text('text', 'A library of unstyled React components for design systems and web apps.');
  panel.appendChild(text);
  text.layoutAlign = 'STRETCH';
  text.textAutoResize = 'HEIGHT';
  c.appendChild(panel);
  panel.layoutAlign = 'STRETCH';
  panel.visible = open;
  return c;
}
