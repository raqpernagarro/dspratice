// Navigation Menu: a List slot of Navigation Menu Items and, under it, the open panel (Show panel)
// with a Links slot of Navigation Menu Links; the arrow points at the open trigger.
async function buildVariant(v, h) {
  const sets = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] });
  const itemSet = sets.find((s) => s.name === 'Navigation Menu Item');
  const linkSet = sets.find((s) => s.name === 'Navigation Menu Link');
  if (!itemSet || !linkSet) throw new Error('Build Navigation Menu Item and Navigation Menu Link first');
  const key = (set, prefix) => Object.keys(set.componentPropertyDefinitions).find((k) => k.startsWith(prefix));
  const icons = globalThis.__icons;
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'AUTO', align: 'MIN' }, 'component');
  const list = h.slot(c, 'List', { direction: 'HORIZONTAL', align: 'CENTER' });
  c.appendChild(list);
  for (const [type, active, text, icon] of [['Link', 'True', 'Home', 'House'], ['Trigger', 'True', 'Overview', 'Compass'], ['Link', 'False', 'Handbook', 'BookOpen']]) {
    const i = itemSet.children.find((x) => { const p = x.variantProperties; return p.Type === type && p.State === 'Default' && p.Active === active; }).createInstance();
    i.name = 'item';
    i.setProperties({ [key(itemSet, 'Label')]: text });
    i.findChild((n) => n.name === 'icon').swapComponent(icons[icon].set.children.find((x) => x.name === (active === 'True' ? 'Format=Stroke, Weight=Fill' : 'Format=Outline, Weight=Regular')));
    list.appendChild(i);
  }
  const popup = h.frame('popup', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN', fill: true, stroke: true });
  popup.resize(320, 100);
  popup.primaryAxisSizingMode = 'AUTO';
  const links = h.slot(c, 'Links', { direction: 'VERTICAL' });
  popup.appendChild(links);
  links.layoutAlign = 'STRETCH';
  for (const [title, description] of [['Quick start', 'Install and assemble your first component.'], ['Accessibility', 'Learn how we build accessible components.'], ['Releases', 'See what’s new in the latest versions.']]) {
    const l = linkSet.children.find((x) => x.variantProperties.State === 'Default').createInstance();
    l.name = 'link';
    l.setProperties({ [key(linkSet, 'Title')]: title, [key(linkSet, 'Description#')]: description });
    links.appendChild(l);
    l.layoutAlign = 'STRETCH';
  }
  c.appendChild(popup);
  addArrow(popup, 'bottom');
  return c;
}

// The arrow points at the open trigger (positions depend on bound sizes).
async function afterBind(set) {
  const popup = set.findChild((n) => n.name === 'popup');
  const trigger = set.findChild((n) => n.name === 'List').children[1];
  const arrow = popup.findChild((n) => n.name === 'arrow');
  arrow.x = Math.round(trigger.x + trigger.width / 2 - 6);
  arrow.y = -5;
}

// The arrow on the edge facing the trigger: a clipping frame (12 × 6, or 6 × 12 on the sides)
// showing half of a bordered diamond whose centre sits on the popup's edge, like code.
const ARROW_CENTRE = { bottom: [6, 6], top: [6, 0], right: [6, 6], left: [0, 6] };
function addArrow(parent, side) {
  const across = side === "left" || side === "right";
  const a = figma.createFrame();
  a.name = "arrow";
  a.fills = [];
  a.clipsContent = true;
  a.resize(across ? 6 : 12, across ? 12 : 6);
  parent.appendChild(a);
  a.layoutPositioning = "ABSOLUTE";
  const s = figma.createFrame();
  s.name = "shape";
  s.resize(6 * Math.SQRT2, 6 * Math.SQRT2);
  s.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  s.strokes = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  s.strokeAlign = "INSIDE";
  a.appendChild(s);
  const c = Math.SQRT1_2;
  const [cx, cy] = ARROW_CENTRE[side];
  s.relativeTransform = [[c, c, cx - 6], [-c, c, cy]];
  placeArrow(a, side);
  return a;
}
// Overlaps the border by 1px so the tip joins the surface. Re-run once sizes are bound.
function placeArrow(a, side) {
  const p = a.parent;
  if (side === "bottom") { a.x = Math.round(p.width / 2 - 6); a.y = -5; a.constraints = { horizontal: "CENTER", vertical: "MIN" }; }
  if (side === "top") { a.x = Math.round(p.width / 2 - 6); a.y = p.height - 1; a.constraints = { horizontal: "CENTER", vertical: "MAX" }; }
  if (side === "right") { a.x = -5; a.y = Math.round(p.height / 2 - 6); a.constraints = { horizontal: "MIN", vertical: "CENTER" }; }
  if (side === "left") { a.x = p.width - 1; a.y = Math.round(p.height / 2 - 6); a.constraints = { horizontal: "MAX", vertical: "CENTER" }; }
}
