// One list for client conversations: every request and deck across projects, newest first, with
// where to continue; Home keeps only the unfinished ones.
import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '@/state/store'
import { practice } from '@/app/routes'
import { conversationItems } from './items'

beforeEach(() => useStore.getState().resetAll())

describe('conversationItems', () => {
  it('lists requests and decks from every project, newest first, each with where to continue', () => {
    const items = conversationItems(useStore.getState().projects)
    expect(items.some((i) => i.kind === 'Client request')).toBe(true)
    expect(items.map((i) => i.at)).toEqual([...items.map((i) => i.at)].sort((a, b) => b - a))
    for (const i of items) expect(i.to.startsWith(i.kind === 'Presentation' ? practice.presentations : practice.opportunities)).toBe(true)
  })

  it('marks a downloaded deck as done', () => {
    const s = useStore.getState()
    const p = Object.values(s.projects).find((x) => Object.keys(x.decks ?? {}).length)
    if (!p) return
    const id = Object.keys(p.decks)[0]
    s.setDeckStage(p.id, id, 'exported')
    const item = conversationItems(useStore.getState().projects).find((i) => i.key === `d-${id}`)!
    expect(item).toMatchObject({ done: true, status: expect.stringContaining('Downloaded') })
  })
})
