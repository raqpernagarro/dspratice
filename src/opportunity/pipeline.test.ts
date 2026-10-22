import { readFileSync } from 'node:fs'
import { extractRequirements } from './extract'
import { composeResponse } from './compose'
import { validateDraft, type AllowedSection } from './validate'
import { buildSeedSources } from '@/fixtures/knowledge/registry'
import { SEED_CONFLICTS } from '@/fixtures/knowledge/conflicts'
import index from '@/fixtures/knowledge/docs/index.generated.json'
import { resolveDocs } from '@/knowledge/resolve'
import type { DocIndexEntry } from '@/knowledge/types'
import { isVisibleTo } from '@/knowledge/selectors'

const rfp = readFileSync('src/fixtures/knowledge/samples/northwind-rfp.md', 'utf8')

describe('Northwind RFP pipeline (zero tokens)', () => {
  const reqs = extractRequirements(rfp, 1)

  it('lists the 14 numbered requirements with spans into the original', () => {
    const numbered = reqs.filter((r) => r.number)
    expect(numbered.map((r) => r.number)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'])
    for (const r of numbered) expect(rfp.slice(r.span!.start, r.span!.end).replace(/\s+/g, ' ')).toContain(r.text.slice(0, 30))
  })

  it('flags what we never answer from documents', () => {
    const kind = (n: string) => reqs.find((r) => r.number === n)?.unanswerable?.kind
    expect(kind('8')).toBe('pricing')
    expect(kind('9')).toBe('credentials')
    expect(kind('10')).toBe('credentials')
    expect(kind('11')).toBe('contract')
    expect(['timeline', 'availability']).toContain(kind('12'))
    expect(kind('13')).toBe('undocumented-capability')
    expect(kind('1')).toBeUndefined()
    expect(kind('3')).toBeUndefined()
  })

  it('drafts a traceable response that passes validation with zero issues', async () => {
    const sources = buildSeedSources(index as unknown as Record<string, DocIndexEntry>).filter((s) => isVisibleTo(s, 'northwind') && s.docId)
    const docs = await resolveDocs(sources.map((s) => s.docId!))
    const usable = sources.filter((s) => docs[s.docId!])
    expect(usable.some((s) => s.id === 'src-contoso-questionnaire')).toBe(false)
    const draft = composeResponse({ opportunity: { title: 'AI-native DS RFP', task: 'rfp', context: { client: 'Northwind Retail', audience: '', objective: '', deliverable: '' } }, requirements: reqs.filter((r) => r.number), client: { name: 'Northwind Retail', sector: 'Retail' }, sources: usable, docs, conflicts: SEED_CONFLICTS, requestText: rfp, now: 0 })
    const allowed = new Map<string, AllowedSection>()
    for (const s of usable) for (const sec of docs[s.docId!].sections) allowed.set(sec.id, { sourceId: s.id, text: sec.text, approval: s.approval })
    const v = validateDraft(draft, { allowed, requirements: reqs, clientName: 'Northwind Retail' })
    const kinds = v.draft.answers.reduce<Record<string, number>>((m, a) => ((m[a.status] = (m[a.status] ?? 0) + 1), m), {})
    expect(v.draft.answers).toHaveLength(14)
    expect(kinds['open-question']).toBe(6)
    expect(v.draft.understanding).not.toMatch(/practice documents/)
    expect(v.draft.answers.filter((a) => a.status === 'open-question')).toHaveLength(6)
    expect(v.draft.approach.package).toBe('2-week AI audit')
  })
})
