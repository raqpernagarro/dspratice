// Collapsible: trigger (label, caret: right while closed, down while open) over the Panel slot.
async function buildVariant(v, h) {
  const open = v.open === 'true';
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN' }, 'component');
  c.resize(220, 40);
  c.primaryAxisSizingMode = 'AUTO';
  const trigger = h.frame('trigger', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', align: 'CENTER', fill: true, stroke: true });
  const label = h.text('label', 'Recovery keys');
  trigger.appendChild(label);
  label.layoutGrow = 1;
  const icon = h.icon('CaretRight', 'Format=Stroke, Weight=Fill');
  icon.name = 'icon';
  if (open) icon.rotation = -90;
  trigger.appendChild(icon);
  c.appendChild(trigger);
  trigger.layoutAlign = 'STRETCH';
  const panel = h.slot(c, 'Panel', { direction: 'VERTICAL' });
  for (const t of ['alien-bean-pasta', 'wild-irish-burrito']) panel.appendChild(h.text('text', t));
  c.appendChild(panel);
  panel.layoutAlign = 'STRETCH';
  panel.visible = open;
  return c;
}
