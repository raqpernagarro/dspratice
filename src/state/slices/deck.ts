// Decks built on Carolina Baptista's Nagarro Master Slides engine (internal; never in client sessions).

import type { DeckActions } from '../actions'
import type { Ctx } from '../ctx'
import type { Deck, DeckSlide } from '../types'
import { uid } from '../sim'

export function deckSlice(ctx: Ctx): DeckActions {
  const { set } = ctx
  const mutate = (projectId: string, id: string, fn: (d: Deck) => void) =>
    set((s) => {
      const d = s.projects[projectId]?.decks[id]
      if (d) fn(d)
    })
  return {
    saveDeck: (projectId, deck) => {
      const id = deck.id || `deck-${uid('d').slice(2)}`
      set((s) => {
        const p = s.projects[projectId]
        if (!p) return
        p.decks[id] = { ...deck, id, builtBy: deck.builtBy || ctx.actorName() }
        if (deck.opportunityId && p.opportunities[deck.opportunityId] && !p.opportunities[deck.opportunityId].deckIds.includes(id)) p.opportunities[deck.opportunityId].deckIds.unshift(id)
      })
      ctx.activity(projectId, `${deck.id ? 'Rebuilt' : 'Built'} the deck "${deck.title}" (${deck.slides.length} slides on Nagarro Master Slides)`, { type: 'deck', id })
      return id
    },
    updateDeck: (projectId, id, patch) => mutate(projectId, id, (d) => Object.assign(d, patch)),
    updateBrief: (projectId, id, patch) => mutate(projectId, id, (d) => Object.assign(d.brief, patch)),
    updateSlide: (projectId, id, slideId, patch) =>
      mutate(projectId, id, (d) => {
        const s = d.slides.find((x) => x.id === slideId)
        if (s) {
          if (patch.spec) s.spec = { ...s.spec, ...patch.spec }
          const { spec: _spec, ...rest } = patch
          void _spec
          Object.assign(s, rest, { edited: true })
          if (d.stage === 'checked' || d.stage === 'exported') d.stage = 'built'
        }
      }),
    moveSlide: (projectId, id, slideId, dir) =>
      mutate(projectId, id, (d) => {
        const i = d.slides.findIndex((x) => x.id === slideId)
        const j = i + dir
        if (i < 0 || j < 0 || j >= d.slides.length) return
        ;[d.slides[i], d.slides[j]] = [d.slides[j], d.slides[i]]
      }),
    removeSlide: (projectId, id, slideId) => mutate(projectId, id, (d) => void (d.slides = d.slides.filter((x) => x.id !== slideId))),
    insertSlide: (projectId, id, slide: DeckSlide, afterId) =>
      mutate(projectId, id, (d) => {
        const at = afterId ? d.slides.findIndex((x) => x.id === afterId) + 1 : d.slides.length
        d.slides.splice(at, 0, slide)
      }),
    setDeckStage: (projectId, id, stage) =>
      mutate(projectId, id, (d) => {
        d.stage = stage
        if (stage === 'exported') d.exportedAt = ctx.now()
      }),
    deleteDeck: (projectId, id) =>
      set((s) => {
        const p = s.projects[projectId]
        if (!p) return
        const d = p.decks[id]
        delete p.decks[id]
        if (d?.opportunityId && p.opportunities[d.opportunityId]) p.opportunities[d.opportunityId].deckIds = p.opportunities[d.opportunityId].deckIds.filter((x) => x !== id)
      }),
  }
}
