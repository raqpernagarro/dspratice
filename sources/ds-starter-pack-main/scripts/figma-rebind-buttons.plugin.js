/**
 * @deprecated Do not delete component tokens. Use `figma-rebind-only.plugin.js` to bind
 * layers to `button/*` / `icon-button/*` in the `components` collection.
 *
 * Sync aliases via REST: npm run figma:export-components && cd variables-github-action && npm run sync-tokens-to-figma -- --input tokens
 * Composites: scripts/.figma-composites-only.js via figma_execute
 */
export default async function () {
  const COMPONENT_SET_IDS = ['221:2', '261:1993']
  const REBIND_MAP = await import('../stories/base-ui/tokens/figma-rebind-map.json')

  const allVars = await figma.variables.getLocalVariablesAsync()
  const byName = new Map(allVars.map((v) => [v.name, v]))

  function semanticVar(name) {
    const v = byName.get(name)
    if (!v) throw new Error(`Missing semantic variable: ${name}`)
    return v
  }

  async function rebindNode(node) {
    if (!('boundVariables' in node) || !node.boundVariables) return
    const bv = node.boundVariables
    for (const field of Object.keys(bv)) {
      const binding = bv[field]
      const entries = Array.isArray(binding) ? binding : [binding]
      for (const entry of entries) {
        if (!entry?.id) continue
        const source = allVars.find((v) => v.id === entry.id)
        if (!source) continue
        const targetName = REBIND_MAP[source.name]
        if (!targetName) continue
        const target = semanticVar(targetName)
        try {
          if (field === 'fills' || field === 'strokes') {
            const paints = field === 'fills' ? node.fills : node.strokes
            if (!Array.isArray(paints)) continue
            const next = paints.map((paint) => {
              if (paint.type !== 'SOLID') return paint
              return figma.variables.setBoundVariableForPaint(paint, 'color', target)
            })
            if (field === 'fills') node.fills = next
            else node.strokes = next
          } else {
            node.setBoundVariable(field, target)
          }
        } catch (e) {
          console.warn('Rebind failed', node.name, field, source.name, e)
        }
      }
    }
    if ('children' in node) {
      for (const child of node.children) await rebindNode(child)
    }
  }

  for (const setId of COMPONENT_SET_IDS) {
    const set = await figma.getNodeByIdAsync(setId)
    if (!set || set.type !== 'COMPONENT_SET') continue
    for (const child of set.children) {
      if (child.type === 'COMPONENT') await rebindNode(child)
    }
  }

  const toDelete = allVars.filter(
    (v) => v.name.startsWith('button/') || v.name.startsWith('icon-button/'),
  )
  for (const v of toDelete) {
    try {
      v.remove()
    } catch (e) {
      console.warn('Could not delete', v.name, e)
    }
  }

  return { rebound: Object.keys(REBIND_MAP).length, deleted: toDelete.length }
}
