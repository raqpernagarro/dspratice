// Popover: title, description and an optional Content slot on the surface; the arrow on the edge
// facing the trigger (Side).
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN', fill: true, stroke: true }, 'component');
  c.resize(240, 80);
  c.primaryAxisSizingMode = 'AUTO';
  for (const [name, text] of [['title', 'Notifications'], ['description', 'You are all caught up. Good job!']]) {
    const t = h.text(name, text);
    c.appendChild(t);
    t.layoutAlign = 'STRETCH';
    t.textAutoResize = 'HEIGHT';
  }
  const content = h.slot(c, 'Content', { direction: 'VERTICAL' });
  c.appendChild(content);
  content.layoutAlign = 'STRETCH';
  addArrow(c, v.side);
  return c;
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
async function afterBind(set) {
  for (const variant of set.type === "COMPONENT_SET" ? set.children : [set]) {
    const side = (variant.variantProperties?.Side ?? "Bottom").toLowerCase();
    for (const a of variant.findAll((n) => n.name === "arrow")) placeArrow(a, side);
  }
}

