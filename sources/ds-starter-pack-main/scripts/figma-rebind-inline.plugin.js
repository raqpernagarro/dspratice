/**
 * Inline rebind for figma_execute — logic mirrors build-figma-semantic-rebind-map.mjs
 */
const COMPONENT_SET_IDS = ['221:2', '261:1993']

const STATE_SUFFIX = {
  default: 'default',
  hover: 'hover',
  pressed: 'pressed',
  disabled: 'disabled',
}

function colorPath(type, destructive, role, state) {
  const s = STATE_SUFFIX[state] ?? state

  if (destructive) {
    if (type === 'primary') {
      if (role === 'bg') return `color/background/interactive/danger/${s}`
      if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : 'color/foreground/on-danger/primary'
      if (role === 'border') return `color/background/interactive/danger/${s}`
    }
    if (type === 'ghost') {
      if (role === 'bg') return `color/background/override/destructive-ghost/${s}`
      if (role === 'fg') return `color/foreground/interactive/danger/${s}`
      if (role === 'border') return `color/border/override/ghost/${s}`
    }
  }

  switch (type) {
    case 'primary':
      if (role === 'bg') return s === 'disabled' ? 'color/background/interactive/disabled' : `color/background/interactive/primary/${s}`
      if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : 'color/foreground/on-interactive/primary'
      if (role === 'border') return s === 'disabled' ? 'color/background/interactive/disabled' : `color/background/interactive/primary/${s}`
      break
    case 'secondary':
      if (role === 'bg') return s === 'disabled' ? 'color/background/interactive/disabled' : `color/background/interactive/secondary/${s}`
      if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : 'color/foreground/neutral/primary'
      if (role === 'border') return `color/border/interactive/${s}`
      break
    case 'ghost':
      if (role === 'bg') return `color/background/override/ghost/${s}`
      if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : `color/foreground/interactive/${s}`
      if (role === 'border') return `color/border/override/ghost/${s}`
      break
    case 'outline':
      if (role === 'bg') return `color/background/override/outline/${s}`
      if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : `color/foreground/interactive/${s}`
      if (role === 'border') return `color/border/interactive/${s}`
      break
  }

  return 'color/foreground/neutral/primary'
}

const DIMENSION_MAP = {
  'button/border-width': 'scale/25',
  'button/border-width/outline': 'scale/25',
  'button/size/sm': 'scale/600',
  'button/size/md': 'scale/900',
  'button/size/lg': 'scale/1200',
  'button/space-x/sm': 'scale/150',
  'button/space-x/md': 'scale/200',
  'button/space-x/lg': 'scale/300',
  'button/space-y/sm': 'scale/100',
  'button/space-y/md': 'scale/200',
  'button/space-y/lg': 'scale/300',
  'button/gap/sm': 'scale/50',
  'button/gap/md': 'scale/50',
  'button/gap/lg': 'scale/100',
  'button/icon/size/sm': 'scale/350',
  'button/icon/size/md': 'scale/400',
  'button/icon/size/lg': 'scale/500',
  'button/radius/sm': 'scale/00',
  'button/radius/md': 'scale/00',
  'button/radius/lg': 'scale/00',
  'button/label/size/sm': 'font/size/body/sm',
  'button/label/size/md': 'font/size/body/md',
  'button/label/size/lg': 'font/size/body/lg',
  'button/label/space-x/sm': 'scale/100',
  'button/label/space-x/md': 'scale/100',
  'button/label/space-x/lg': 'scale/100',
  'icon-button/border-width': 'scale/25',
  'icon-button/size/sm': 'scale/600',
  'icon-button/size/md': 'scale/900',
  'icon-button/size/lg': 'scale/1200',
  'icon-button/icon/size/sm': 'scale/350',
  'icon-button/icon/size/md': 'scale/400',
  'icon-button/icon/size/lg': 'scale/500',
  'icon-button/radius/sm': 'scale/00',
  'icon-button/radius/md': 'scale/00',
  'icon-button/radius/lg': 'scale/00',
}

function mapComponentVariable(name) {
  if (DIMENSION_MAP[name]) return DIMENSION_MAP[name]
  const normalized = name.replace(/^icon-button\//, 'button/')
  if (DIMENSION_MAP[normalized]) return DIMENSION_MAP[normalized]

  const colorMatch = normalized.match(/^button\/(background|foreground|border-color)\/(.+)$/)
  if (!colorMatch) return null

  const [, roleKey, tail] = colorMatch
  const role = roleKey === 'background' ? 'bg' : roleKey === 'foreground' ? 'fg' : 'border'

  let destructive = false
  let rest = tail
  if (rest.startsWith('destructive/')) {
    destructive = true
    const sub = rest.slice('destructive/'.length)
    rest = sub.includes('/') ? sub : `primary/${sub}`
  }

  const segments = rest.split('/')
  const buttonType = segments[0]
  const state = segments[1] ?? 'default'

  return colorPath(buttonType, destructive, role, state)
}

const allVars = await figma.variables.getLocalVariablesAsync()
const byName = new Map(allVars.map((v) => [v.name, v]))

let reboundCount = 0
const missing = new Set()

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
      const targetName = mapComponentVariable(source.name)
      if (!targetName) continue
      const target = byName.get(targetName)
      if (!target) {
        missing.add(targetName)
        continue
      }
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
        reboundCount++
      } catch (e) {
        console.warn('Rebind failed', node.name, field, source.name, String(e))
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
let deleted = 0
for (const v of toDelete) {
  try {
    v.remove()
    deleted++
  } catch (e) {
    console.warn('Could not delete', v.name, String(e))
  }
}

return {
  reboundBindings: reboundCount,
  deletedComponentVars: deleted,
  missingSemantic: [...missing].slice(0, 30),
}
