import { describe, expect, it } from 'vitest'

import { sanitizeTree } from './schema'

describe('screen trees from the agent', () => {
  it('keeps nodes and strings, drops junk', () => {
    const tree = sanitizeTree({ type: 'stack', children: ['Hello', { type: 'button', props: { label: 'Go' } }, 42, null, { nope: true }] })
    expect(tree?.children).toEqual(['Hello', { type: 'button', props: { label: 'Go' }, children: undefined }])
  })

  it('caps depth so a runaway tree cannot hang the page', () => {
    let deep: object = { type: 'text' }
    for (let i = 0; i < 40; i++) deep = { type: 'box', children: [deep] }
    let depth = 0
    let node = sanitizeTree(deep)
    while (node?.children?.[0] && typeof node.children[0] !== 'string') {
      node = node.children[0]
      depth++
    }
    expect(depth).toBeLessThanOrEqual(14)
  })

  it('rejects a root that is not a node', () => {
    expect(sanitizeTree('just text')).toBeNull()
  })
})
