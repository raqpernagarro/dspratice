// The knowledge library: bundled seed documents, scope rules, the document store and retrieval.
import { describe, expect, it } from 'vitest'
import { buildSeedSources } from '@/fixtures/knowledge/registry'
import index from '@/fixtures/knowledge/docs/index.generated.json'
import { resolveDoc, resolveKnowledgeDoc } from './resolve'
import { isVisibleTo, visibleSources } from './selectors'
import { createMemoryDocStore, __setDocStore, putDoc } from './docStore'
import { buildIndex, search } from './retrieve'
import { buildDocument } from './extract/sections'
import type { DocIndexEntry, KnowledgeDocument } from './types'

const seeds = buildSeedSources(index as unknown as Record<string, DocIndexEntry>)

describe('seed registry', () => {
  it('every readable seed resolves to its bundled document', async () => {
    const readable = seeds.filter((s) => s.docId)
    expect(readable.length).toBeGreaterThan(20)
    for (const s of readable) {
      const doc = await resolveKnowledgeDoc(s.docId)
      expect(doc, s.id).toBeTruthy()
      expect(doc!.sourceId).toBe(s.id)
      expect(doc!.sections.length, s.id).toBeGreaterThan(0)
    }
  })

  it('no captured text carries the client footer or client frames of the offer deck', async () => {
    for (const s of seeds.filter((x) => x.docId)) {
      const doc = (await resolveKnowledgeDoc(s.docId)) as KnowledgeDocument
      const text = doc.sections.map((x) => `${x.heading}\n${x.text}`).join('\n')
      expect(text, s.id).not.toMatch(/Prepared for Charter|Understanding Charter|Charter Communications/)
    }
  })

  it('only recorded verdicts start approved, each with an approver', () => {
    for (const s of seeds.filter((x) => x.approval === 'approved')) expect(s.approvedBy, s.id).toBeTruthy()
    const approved = seeds.filter((x) => x.approval === 'approved').map((x) => x.id)
    expect(approved).toContain('src-offer-deck')
    expect(approved).not.toContain('src-battle-card')
  })
})

describe('client scope', () => {
  const contosoQ = seeds.find((s) => s.id === 'src-contoso-questionnaire')!
  const contosoNote = seeds.find((s) => s.id === 'src-contoso-multibrand-note')!
  const practice = seeds.find((s) => s.id === 'src-offer-deck')!

  it('a client-scoped source stays with its client unless approved for reuse', () => {
    expect(isVisibleTo(contosoQ, 'contoso')).toBe(true)
    expect(isVisibleTo(contosoQ, 'northwind')).toBe(false)
    expect(isVisibleTo(contosoNote, 'northwind')).toBe(true)
    expect(isVisibleTo(practice, 'northwind')).toBe(true)
    expect(visibleSources(seeds, 'demo-brand').map((s) => s.id)).not.toContain('src-contoso-questionnaire')
  })

  it('the isolation marker exists only in the Contoso questionnaire', async () => {
    for (const s of seeds.filter((x) => x.docId && x.id !== 'src-contoso-questionnaire')) {
      const doc = await resolveDoc(s.docId!)
      expect(JSON.stringify(doc), s.id).not.toContain('CONTOSO-ISOLATION-MARKER')
    }
  })
})

describe('document store', () => {
  it('stores user documents and refuses to overwrite bundled seeds', async () => {
    __setDocStore(createMemoryDocStore())
    await putDoc('upload.test', { id: 'upload.test', hash: 'h', text: 'hello', storedAt: 0 })
    expect(await resolveDoc('upload.test')).toMatchObject({ text: 'hello' })
    await expect(putDoc('seed.offer-deck', { id: 'seed.offer-deck', hash: 'h', text: 'x', storedAt: 0 })).rejects.toThrow()
  })
})

describe('retrieval', () => {
  const doc = buildDocument({ docId: 'd1', sourceId: 's1', readBy: 'paste', readAt: 0 }, [
    { canonical: 'a.md#1', heading: 'Documentation and handover', text: 'We hand over with training, coaching and a named owner so the client team runs the system.', ref: { path: 'a.md' }, kind: 'heading' },
    { canonical: 'a.md#2', heading: 'Token governance', text: 'Changes to semantic tokens are reviewed by the system owner; AI-proposed changes follow the same review.', ref: { path: 'a.md' }, kind: 'heading' },
  ])
  const source = seeds[0]
  const idx = () => buildIndex([{ source: { ...source, id: 's1', tags: [] }, doc }])

  it('finds governance material for an ownership question through the synonym map', () => {
    const hits = search(idx(), 'Who approves changes proposed by AI tools? Describe ownership.')
    expect(hits[0].sectionId).toBe(doc.sections[1].id)
    expect(hits[0].why).toMatch(/related topic/)
  })

  it('explains a match with the heading\'s own words, not their stems', () => {
    const hits = search(idx(), 'documentation and handover after the engagement')
    expect(hits[0].why).toContain('"documentation"')
    expect(hits[0].why).not.toContain('documentate')
  })
})
