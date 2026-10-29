// Select: a field box (like Input) with the value and an up/down caret.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', align: 'CENTER', fill: true, stroke: true }, 'component');
  c.resize(240, 36);
  const value = h.text('value', v.filled === 'true' ? 'Honeycrisp' : 'Select apple');
  c.appendChild(value);
  value.layoutGrow = 1;
  value.textAutoResize = 'HEIGHT';
  const icon = h.icon('CaretUpDown', 'Format=Stroke, Weight=Fill');
  icon.name = 'icon';
  c.appendChild(icon);
  return c;
}
