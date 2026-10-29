// Combobox: a field box (like Input) with the text, a clear button (only while filled) and the trigger.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', align: 'CENTER', fill: true, stroke: true }, 'component');
  c.resize(240, 36);
  const value = h.text('value', v.filled === 'true' ? 'Apple' : 'e.g. Apple');
  c.appendChild(value);
  value.layoutGrow = 1;
  value.textAutoResize = 'HEIGHT';
  const clear = h.icon('X', 'Format=Outline, Weight=Bold');
  clear.name = 'clear';
  clear.visible = v.filled === 'true';
  c.appendChild(clear);
  const trigger = h.icon('CaretDown', 'Format=Stroke, Weight=Fill');
  trigger.name = 'trigger';
  c.appendChild(trigger);
  return c;
}
