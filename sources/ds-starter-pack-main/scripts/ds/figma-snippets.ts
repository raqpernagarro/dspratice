/**
 * Plugin-code building blocks shared by the Figma scripts (figma-bind, figma-build, figma-scan).
 * Snippets run in the Figma file through figma-console's `figma_execute` (async function body).
 */
import { PROPERTIES, axis, bindingCombos, part, valueOf, variantsOf, figmaProps, type ComponentSpec } from '../../stories/base-ui/spec'

/** One rule per binding: layers × fields, and the token per combination of the axes it varies by. */
export function bindRules(spec: ComponentSpec) {
  return spec.bindings
    .filter((b) => b.on !== 'code' && !b.when)
    .map((b) => ({
      layers: b.figmaLayers ?? [part(spec, b.part).figma].flat(),
      fields: PROPERTIES[b.property].figma,
      axes: b.by.map((id) => axis(spec, id).figma),
      values: Object.fromEntries(
        bindingCombos(spec, b).map((v) => [b.by.map((id) => axis(spec, id).values.find((x) => x.code === v[id])!.figma).join('|'), valueOf(b, v)]),
      ),
    }))
}

/** Every variant of a spec: Figma props and code values. */
export const variantList = (spec: ComponentSpec) => variantsOf(spec).map((v) => ({ props: figmaProps(spec, v), values: v }))

/** Token path ↔ Figma effect style (same rule as effectStyleToken in spec/types.ts). */
const STYLE_TOKEN = `const styleToken = (name) => 'effect/' + name.trim().toLowerCase().replace(/\\s+/g, '-');`

/**
 * bindSpecs(specs, apply) → report. Binds (or checks) every rule on every variant of each set.
 * Values are variable names, an effect style's token path (effectStyle), or 'none' (no style).
 */
export const BIND_RUNTIME = `
async function bindSpecs(SPECS, APPLY) {
  const vars = await figma.variables.getLocalVariablesAsync();
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const colName = new Map(cols.map((c) => [c.id, c.name]));
  // Prefer semantic > components > primitives when names repeat across collections.
  const rank = (v) => ({ semantic: 0, components: 1 })[colName.get(v.variableCollectionId)] ?? 2;
  const byName = new Map();
  for (const v of [...vars].sort((a, b) => rank(b) - rank(a))) byName.set(v.name, v);
  const nameOf = new Map(vars.map((v) => [v.id, v.name]));
  const styles = new Map((await figma.getLocalEffectStylesAsync()).map((s) => [styleToken(s.name), s]));
  const styleName = new Map([...styles].map(([t, s]) => [s.id, t]));
  const textStyles = new Map((await figma.getLocalTextStylesAsync()).map((s) => [s.name, s]));
  const textStyleName = new Map([...textStyles].map(([n, s]) => [s.id, n]));
  const TEXT_FIELDS = new Set(['fontSize', 'lineHeight', 'fontWeight', 'fontFamily', 'letterSpacing']);
  const fonts = new Map();

  const nodesAt = (rootNode, layer) => {
    if (!layer) return [rootNode];
    let level = [rootNode];
    for (const name of layer.split(' › ')) {
      const next = [];
      for (const n of level) if ('children' in n) for (const c of n.children) if (c.name === name) next.push(c);
      level = next;
    }
    return level;
  };
  // What a field is bound to now, as a name (variable name / style token / 'none').
  const current = (node, field) => {
    if (field === 'effectStyle') return node.effectStyleId ? (styleName.get(node.effectStyleId) ?? node.effectStyleId) : 'none';
    if (field === 'textStyle') return typeof node.textStyleId === 'string' && node.textStyleId ? (textStyleName.get(node.textStyleId) ?? node.textStyleId) : 'none';
    let id;
    if (field === 'fills' || field === 'strokes') {
      const p = node[field]?.[0];
      id = p?.type === 'SOLID' ? p.boundVariables?.color?.id : undefined;
    } else {
      // Text fields come back as one alias per text range.
      const b = node.boundVariables?.[field];
      id = Array.isArray(b) ? (b.length && b.every((x) => x.id === b[0].id) ? b[0].id : undefined) : b?.id;
    }
    return id ? (nameOf.get(id) ?? id) : 'unbound';
  };
  const apply = async (node, field, want) => {
    if (field === 'effectStyle') return node.setEffectStyleIdAsync(want === 'none' ? '' : styles.get(want).id);
    if (field === 'textStyle') {
      // The style carries the font bindings: drop node-level ones so nothing detaches it.
      const style = textStyles.get(want);
      await (fonts.get(want) ?? fonts.set(want, figma.loadFontAsync(style.fontName)).get(want));
      for (const f of TEXT_FIELDS) if (node.boundVariables?.[f]) node.setBoundVariable(f, null);
      return node.setTextStyleIdAsync(style.id);
    }
    const variable = byName.get(want);
    if (field === 'fills' || field === 'strokes') {
      const paints = [...node[field]];
      const base = paints[0]?.type === 'SOLID' ? paints[0] : { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
      paints[0] = figma.variables.setBoundVariableForPaint(base, 'color', variable);
      node[field] = paints;
      return;
    }
    if (TEXT_FIELDS.has(field) && node.type === 'TEXT' && node.fontName !== figma.mixed) await figma.loadFontAsync(node.fontName);
    node.setBoundVariable(field, variable);
  };

  await figma.loadAllPagesAsync();
  const report = [];
  for (const spec of SPECS) {
    // A component set, or a single component for specs without variant axes (Menu).
    const set = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] }).find((s) => s.name === spec.name && s.parent?.type !== 'COMPONENT_SET');
    if (!set) { report.push({ component: spec.name, error: 'component not found' }); continue; }
    const r = { component: spec.name, ok: 0, changed: 0, differs: {}, missingLayers: {}, missing: [], errors: [] };
    const pending = [];
    for (const variant of set.type === 'COMPONENT_SET' ? set.children : [set]) {
      if (variant.type !== 'COMPONENT') continue;
      const props = variant.variantProperties ?? {};
      for (const rule of spec.rules) {
        const want = rule.values[rule.axes.map((a) => props[a]).join('|')];
        if (!want) continue;
        const known = rule.fields.includes('effectStyle') ? styles.has(want) : rule.fields.includes('textStyle') ? textStyles.has(want) : byName.has(want);
        if (want !== 'none' && !known) { if (!r.missing.includes(want)) r.missing.push(want); continue; }
        for (const layer of rule.layers) {
          const nodes = nodesAt(variant, layer);
          if (!nodes.length) { r.missingLayers[layer] = (r.missingLayers[layer] ?? 0) + 1; continue; }
          for (const node of nodes) for (const field of rule.fields) {
            // Paint fields only bind an existing paint (an icon's empty bounding vector stays empty).
            if ((field === 'fills' || field === 'strokes') && !node[field]?.length) { r.noPaint = (r.noPaint ?? 0) + 1; continue; }
            const has = current(node, field);
            if (has === want) { r.ok++; continue; }
            const key = (layer || '(root)') + ' · ' + field + ': ' + has + ' → ' + want;
            r.differs[key] = (r.differs[key] ?? 0) + 1;
            if (!APPLY) continue;
            // Async style calls resolve on Figma's next frame (throttled while Figma is in the
            // background): start them all, await them together.
            const fail = (e) => r.errors.push(variant.name + ' / ' + layer + ' · ' + field + ': ' + (e?.message ?? e));
            try { const p = apply(node, field, want); r.changed++; if (p && p.then) pending.push(p.catch(fail)); }
            catch (e) { fail(e); }
          }
        }
      }
    }
    await Promise.all(pending);
    r.errors = r.errors.slice(0, 20);
    report.push(r);
  }
  return report;
}
`

/**
 * scanSets(names?) → anatomy of component sets (all, or those named): every variant's bound
 * variables and effect styles, layer by layer. Same shape as figma-components.json.
 */
export const SCAN_RUNTIME = `
async function scanSets(names) {
  await figma.loadAllPagesAsync();
  const variables = await figma.variables.getLocalVariablesAsync();
  const nameById = new Map(variables.map((v) => [v.id, v.name]));
  const styleName = new Map((await figma.getLocalEffectStylesAsync()).map((s) => [s.id, styleToken(s.name)]));
  const textStyleName = new Map((await figma.getLocalTextStylesAsync()).map((s) => [s.id, s.name]));
  const out = [];
  // Component sets, plus single components (no variants) such as Menu.
  const roots = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] }).filter((n) => n.parent?.type !== 'COMPONENT_SET');
  for (const set of roots) {
    if (names && !names.includes(set.name)) continue;
    const axes = {};
    if (set.type === 'COMPONENT_SET') for (const [key, def] of Object.entries(set.componentPropertyDefinitions)) if (def.type === 'VARIANT') axes[key] = [...(def.variantOptions ?? [])];
    const variants = [];
    for (const variant of set.type === 'COMPONENT_SET' ? set.children : [set]) {
      if (variant.type !== 'COMPONENT') continue;
      const bindings = [];
      const walk = (n, layer) => {
        for (const [field, value] of Object.entries(n.boundVariables ?? {})) {
          if (field === 'fills' || field === 'strokes' || field === 'componentProperties' || field === 'effects') continue;
        // Font fields bound through a text style belong to the style, not the layer.
        if (n.type === 'TEXT' && typeof n.textStyleId === 'string' && n.textStyleId && ['fontSize', 'lineHeight', 'fontWeight', 'fontFamily', 'letterSpacing'].includes(field)) continue;
          for (const a of Array.isArray(value) ? value : [value]) { const name = a && nameById.get(a.id); if (name) bindings.push({ layer, nodeType: n.type, field, variable: name }); }
        }
        for (const field of ['fills', 'strokes']) {
          const paints = n[field];
          if (!Array.isArray(paints)) continue;
          for (const p of paints) { const id = p.type === 'SOLID' ? p.boundVariables?.color?.id : undefined; const name = id && nameById.get(id); if (name) bindings.push({ layer, nodeType: n.type, field, variable: name }); }
        }
        if (n.effectStyleId && styleName.has(n.effectStyleId)) bindings.push({ layer, nodeType: n.type, field: 'effectStyle', variable: styleName.get(n.effectStyleId) });
        if (n.type === 'TEXT' && typeof n.textStyleId === 'string' && textStyleName.has(n.textStyleId)) bindings.push({ layer, nodeType: n.type, field: 'textStyle', variable: textStyleName.get(n.textStyleId) });
        if ('children' in n) for (const c of n.children) walk(c, layer ? layer + ' › ' + c.name : c.name);
      };
      walk(variant, '');
      variants.push({ props: { ...(variant.variantProperties ?? {}) }, bindings });
    }
    out.push({ name: set.name, axes, variants });
  }
  return out;
}
`

/**
 * Helpers for build scripts (scripts/ds/figma/<slug>.build.js). A build file defines
 * `buildVariant(values, h)` returning the variant's ComponentNode (children named after the spec's
 * part paths) and optionally `afterSet(set, h)` to add component properties.
 */
export const BUILD_RUNTIME = `
/** Local text styles and the font tokens they're bound to (figma-text-styles.json). */
async function textStyleTable() {
  const vars = await figma.variables.getLocalVariablesAsync();
  const nameById = new Map(vars.map((v) => [v.id, v.name]));
  return (await figma.getLocalTextStylesAsync()).map((s) => {
    const b = s.boundVariables ?? {};
    const n = (f) => (b[f] ? nameById.get(b[f].id) : null);
    return { name: s.name, fontFamily: n('fontFamily'), fontSize: n('fontSize'), lineHeight: n('lineHeight'), fontWeight: n('fontWeight') };
  });
}

/**
 * Library icons, imported once per session (an import takes ~40 s, so run the icons snippet and
 * let it finish in the background before building). ICONS: { name: componentSetKey }.
 */
function loadIcons(ICONS) {
  globalThis.__icons = globalThis.__icons ?? {};
  for (const [name, key] of Object.entries(ICONS)) {
    if (globalThis.__icons[name]?.status === 'ok' || globalThis.__icons[name]?.status === 'pending') continue;
    const entry = { status: 'pending', started: Date.now() };
    globalThis.__icons[name] = entry;
    figma.importComponentSetByKeyAsync(key).then((set) => { entry.status = 'ok'; entry.set = set; }).catch((e) => { entry.status = 'error'; entry.error = String(e); });
  }
  return Object.fromEntries(Object.entries(globalThis.__icons).map(([k, v]) => [k, v.status]));
}

const FONT = { family: 'Hanken Grotesk', style: 'Regular' };
const h = {
  /** An instance of a library icon (loaded with loadIcons): h.icon('Check', 'Format=Outline, Weight=Bold'). */
  icon(name, variant) {
    const entry = globalThis.__icons?.[name];
    if (entry?.status !== 'ok') throw new Error('Icon "' + name + '" not loaded yet (' + (entry?.status ?? 'not requested') + '): run the icons snippet and wait');
    const v = entry.set.children.find((c) => c.name === variant);
    if (!v) throw new Error('Icon "' + name + '" has no variant "' + variant + '"');
    return v.createInstance();
  },
  /** Auto-layout frame (or component when kind = 'component'). */
  frame(name, opts = {}, kind = 'frame') {
    const f = kind === 'component' ? figma.createComponent() : figma.createFrame();
    f.name = name;
    f.layoutMode = opts.direction ?? 'HORIZONTAL';
    f.primaryAxisSizingMode = opts.primary ?? 'AUTO';
    f.counterAxisSizingMode = opts.counter ?? 'AUTO';
    f.primaryAxisAlignItems = opts.justify ?? 'MIN';
    f.counterAxisAlignItems = opts.align ?? 'CENTER';
    f.fills = opts.fill ? [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }] : [];
    if (opts.stroke) { f.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]; f.strokeAlign = 'INSIDE'; }
    // Strokes take layout space, like CSS borders.
    f.strokesIncludedInLayout = true;
    f.clipsContent = false;
    if (opts.width) f.resize(opts.width, f.height);
    return f;
  },
  /**
   * A Figma slot (a drop zone designers fill per instance) of component c, set up like h.frame. It
   * starts as c's last child: append it where it belongs (it may sit inside a frame).
   */
  slot(c, name, opts = {}) {
    const s = c.createSlot();
    s.name = name;
    s.layoutMode = opts.direction ?? 'VERTICAL';
    s.primaryAxisSizingMode = opts.primary ?? 'AUTO';
    s.counterAxisSizingMode = opts.counter ?? 'AUTO';
    s.primaryAxisAlignItems = opts.justify ?? 'MIN';
    s.counterAxisAlignItems = opts.align ?? 'MIN';
    s.fills = opts.fill ? [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }] : [];
    if (opts.stroke) { s.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]; s.strokeAlign = 'INSIDE'; }
    s.strokesIncludedInLayout = true;
    s.clipsContent = false;
    return s;
  },
  text(name, characters) {
    const t = figma.createText();
    t.name = name;
    t.fontName = FONT;
    t.characters = characters;
    t.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    return t;
  },
  /** Variant name from Figma props: "Size=Medium, State=Default". */
  variantName: (props) => Object.entries(props).map(([k, v]) => k + '=' + v).join(', '),
};

/** Layers at a path ('' = the node itself), names joined by ' › '. */
function layersAt(rootNode, layer) {
  if (!layer) return [rootNode];
  let level = [rootNode];
  for (const name of layer.split(' › ')) {
    const next = [];
    for (const n of level) if ('children' in n) for (const c of n.children) if (c.name === name) next.push(c);
    level = next;
  }
  return level;
}

/**
 * The spec's Figma properties (figmaProps): booleans and text properties wired to their layers in
 * every variant, preferred instances on slots, exposed nested instances. Slots themselves are made
 * by the build file (h.slot). Returns what it couldn't find.
 */
async function applyFigmaProps(set, PROPS) {
  const variants = set.type === 'COMPONENT_SET' ? set.children.filter((c) => c.type === 'COMPONENT') : [set];
  const missing = [];
  const roots = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] }).filter((n) => n.parent?.type !== 'COMPONENT_SET');
  for (const p of PROPS) {
    if (p.kind === 'slot') {
      const key = Object.keys(set.componentPropertyDefinitions).find((k) => set.componentPropertyDefinitions[k].type === 'SLOT' && k.split('#')[0] === p.layer.split(' › ').pop());
      if (!key) { missing.push('slot ' + p.layer); continue; }
      const preferred = (p.preferred ?? []).map((name) => roots.find((r) => r.name === name)).filter(Boolean);
      if ((p.preferred ?? []).length !== preferred.length) missing.push('preferred of ' + p.layer);
      if (preferred.length) set.editComponentProperty(key, { preferredValues: preferred.map((r) => ({ type: r.type, key: r.key })) });
      continue;
    }
    if (p.kind === 'expose') {
      let n = 0;
      for (const v of variants) for (const node of layersAt(v, p.layer)) if (node.type === 'INSTANCE') { node.isExposedInstance = true; n++; }
      if (!n) missing.push('instance ' + p.layer);
      continue;
    }
    const field = p.kind === 'boolean' ? 'visible' : 'characters';
    const type = p.kind === 'boolean' ? 'BOOLEAN' : 'TEXT';
    // Idempotent: reuse a property of the same name and type (a re-run must not add "Label2").
    const key = Object.keys(set.componentPropertyDefinitions).find((k) => k.split('#')[0] === p.name && set.componentPropertyDefinitions[k].type === type) ?? set.addComponentProperty(p.name, type, p.default);
    let n = 0;
    for (const v of variants) for (const layer of p.layers) for (const node of layersAt(v, layer)) {
      if (field === 'characters' && node.type !== 'TEXT') continue;
      node.componentPropertyReferences = { ...(node.componentPropertyReferences ?? {}), [field]: key };
      n++;
    }
    if (!n) missing.push(p.kind + ' ' + p.name);
  }
  return missing;
}

async function buildSet(name, pageName, VARIANTS, REPLACE, buildVariant, afterSet) {
  for (const style of ['Regular', 'Medium', 'SemiBold', 'Bold']) { try { await figma.loadFontAsync({ family: FONT.family, style }); } catch (e) {} }
  await figma.loadAllPagesAsync();
  const old = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] }).find((s) => s.name === name && s.parent?.type !== 'COMPONENT_SET');
  if (old && !REPLACE) throw new Error('"' + name + '" already exists; pass --replace to rebuild it');
  let page = figma.root.children.find((p) => p.name === pageName);
  if (!page) { page = figma.createPage(); page.name = pageName; }
  await figma.setCurrentPageAsync(page);
  const comps = [];
  for (const { props, values } of VARIANTS) {
    const c = await buildVariant(values, h, props);
    c.name = h.variantName(props);
    page.appendChild(c);
    comps.push(c);
  }
  // No variant axes: a single component instead of a set.
  const single = VARIANTS.length === 1 && !Object.keys(VARIANTS[0].props).length;
  const set = single ? comps[0] : figma.combineAsVariants(comps, page);
  set.name = name;
  if (afterSet) await afterSet(set, h);
  if (old) { set.x = old.x; set.y = old.y; const parent = old.parent; parent.appendChild(set); old.remove(); }
  else {
    // Below everything else on the page, inside a section named after the component.
    const bottom = Math.max(0, ...page.children.filter((n) => n !== set).map((n) => n.y + n.height));
    const section = figma.createSection();
    section.name = '❖ ' + name;
    page.appendChild(section);
    section.x = 0; section.y = bottom + 200;
    section.appendChild(set);
    set.x = 80; set.y = 80;
  }
  return set;
}

/**
 * Grid like the code matrix (run after binding, when sizes are final): one column per value of
 * COLUMN (State), one row per combination of the other axes, in the set's variant order.
 */
function layoutSet(set, COLUMN) {
  if (set.type !== 'COMPONENT_SET') {
    if (set.parent?.type === 'SECTION') set.parent.resizeWithoutConstraints(set.x + set.width + 80, set.y + set.height + 80);
    return;
  }
  const rest = (props) => Object.entries(props).filter(([a]) => !COLUMN || a !== COLUMN.name).map(([, v]) => v).join('|');
  const rowKeys = [];
  for (const c of set.children) if (!rowKeys.includes(rest(c.variantProperties))) rowKeys.push(rest(c.variantProperties));
  const colOf = (props) => (COLUMN ? Math.max(0, COLUMN.values.indexOf(props[COLUMN.name])) : 0);
  const rowOf = (props) => rowKeys.indexOf(rest(props));
  const GAP = 24, PAD = 32;
  const colW = Math.max(...set.children.map((c) => c.width));
  const rowH = rowKeys.map((_, r) => Math.max(...set.children.filter((c) => rowOf(c.variantProperties) === r).map((c) => c.height)));
  const rowY = rowH.map((_, r) => PAD + rowH.slice(0, r).reduce((a, b) => a + b + GAP, 0));
  for (const c of set.children) { c.x = PAD + colOf(c.variantProperties) * (colW + GAP); c.y = rowY[rowOf(c.variantProperties)] + (rowH[rowOf(c.variantProperties)] - c.height) / 2; }
  const cols = COLUMN ? COLUMN.values.length : 1;
  set.resizeWithoutConstraints(PAD * 2 + cols * colW + (cols - 1) * GAP, rowY[rowY.length - 1] + rowH[rowH.length - 1] + PAD);
  set.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  set.strokes = [{ type: 'SOLID', color: { r: 0.6, g: 0.4, b: 1 } }];
  set.dashPattern = [6, 4];
  set.cornerRadius = 8;
  if (set.parent?.type === 'SECTION') set.parent.resizeWithoutConstraints(set.x + set.width + 80, set.y + set.height + 80);
}
`

import { createHash } from 'node:crypto'

const RUNTIME_SOURCE = STYLE_TOKEN + BIND_RUNTIME + SCAN_RUNTIME + BUILD_RUNTIME
/** Changes whenever the runtime changes, so snippets can tell a stale install. */
export const RUNTIME_VERSION = createHash('sha1').update(RUNTIME_SOURCE).digest('hex').slice(0, 10)

/** Installs the runtime as globalThis.__ds in the plugin (it stays while the bridge plugin is open). */
export const RUNTIME_INSTALL = `// Generated by scripts/ds/figma-runtime.ts. Run once per bridge session.
${RUNTIME_SOURCE}
globalThis.__ds = { version: '${RUNTIME_VERSION}', bindSpecs, scanSets, buildSet, layoutSet, textStyleTable, loadIcons, applyFigmaProps, layersAt, h };
return 'DS runtime ${RUNTIME_VERSION} installed';
`

/** First line of every snippet: fail clearly when the runtime is missing or stale. */
export const RUNTIME_GUARD = `if (globalThis.__ds?.version !== '${RUNTIME_VERSION}') throw new Error('DS runtime missing or stale: run scripts/ds/.out/runtime.js (npm run ds:figma-runtime) first');
const { bindSpecs, scanSets, buildSet, layoutSet, textStyleTable, loadIcons, applyFigmaProps, layersAt, h } = globalThis.__ds;`
