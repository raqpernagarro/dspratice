// Dialog: the surface, centred over the page.
async function buildVariant(v, h) {
  return dialogFrame(h, 'Notifications', 'You are all caught up. Good job!', [['Secondary', 'False', 'Close']]);
}

// Header (title, description), an optional Body slot, an Actions slot of Buttons, and a close
// button (ghost Icon Button with a cross) in the top corner. The backdrop is code only.
async function dialogFrame(h, title, description, actions) {
  const sets = figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] });
  const buttonSet = sets.find((s) => s.name === "Button");
  const iconButtonSet = sets.find((s) => s.name === "Icon Button");
  const key = (prefix) => Object.keys(buttonSet.componentPropertyDefinitions).find((k) => k.startsWith(prefix));
  const c = h.frame("", { direction: "VERTICAL", primary: "AUTO", counter: "FIXED", align: "MIN", fill: true, stroke: true }, "component");
  c.resize(384, 160);
  c.primaryAxisSizingMode = "AUTO";
  const header = h.frame("header", { direction: "VERTICAL", align: "MIN" });
  for (const [name, text] of [["title", title], ["description", description]]) {
    const t = h.text(name, text);
    header.appendChild(t);
    t.layoutAlign = "STRETCH";
    t.textAutoResize = "HEIGHT";
  }
  c.appendChild(header);
  const body = h.slot(c, "Body", { direction: "VERTICAL" });
  c.appendChild(body);
  const row = h.slot(c, "Actions", { direction: "HORIZONTAL", justify: "MAX", align: "CENTER" });
  c.appendChild(row);
  for (const [type, destructive, text] of actions) {
    const b = buttonSet.children.find((x) => { const p = x.variantProperties; return p.Type === type && p.Size === "Medium" && p.State === "Default" && p.Destructive === destructive; }).createInstance();
    b.name = "action";
    const props = { [key("Text")]: text };
    if (key("Show Lead")) props[key("Show Lead")] = false;
    if (key("Show Trail")) props[key("Show Trail")] = false;
    b.setProperties(props);
    row.appendChild(b);
  }
  for (const n of c.children) n.layoutAlign = "STRETCH";
  // A horizontal row only stretches with a fixed width (hugging would pull the buttons to the start).
  row.primaryAxisSizingMode = "FIXED";
  const close = iconButtonSet.children.find((x) => { const p = x.variantProperties; return p.Type === "Ghost" && p.Size === "Small" && p.State === "Default" && p.Destructive === "False"; }).createInstance();
  close.name = "close";
  const glyph = close.findOne((n) => n.type === "INSTANCE" && n.name.toLowerCase() === "icon");
  glyph.swapComponent(globalThis.__icons.X.set.children.find((x) => x.name === "Format=Outline, Weight=Bold"));
  c.appendChild(close);
  close.layoutPositioning = "ABSOLUTE";
  close.constraints = { horizontal: "MAX", vertical: "MIN" };
  return c;
}

// The close button sits in the top corner once sizes are bound.
async function afterBind(set) {
  for (const variant of set.type === "COMPONENT_SET" ? set.children : [set]) {
    const close = variant.findChild((n) => n.name === "close");
    close.x = variant.width - close.width - 8;
    close.y = 8;
  }
}

