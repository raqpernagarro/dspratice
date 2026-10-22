// Sample opportunities (fictional clients). Northwind's RFP is imported and waiting for the
// context to be confirmed, so the whole workflow can be walked from step 3. Contoso's questionnaire
// stays inside the Contoso engagement and proves isolation.

import type { Opportunity } from '../../opportunity/types.ts'
import type { DocIndexEntry } from '../../knowledge/types.ts'
import rfp from './docs/northwind-rfp.doc.json' with { type: 'json' }

export function seedOpportunities(index: Record<string, DocIndexEntry>) {
  return (projectId: string, t: number): Record<string, Opportunity> => {
    const base = { requirements: [], sourceSelection: { included: [], excluded: [], recommended: [] }, responses: [], aiUsage: { inputTokens: 0, outputTokens: 0, calls: 0 }, publishedOutputIds: [], deckIds: [], createdBy: 'Seed' }
    if (projectId === 'northwind') {
      const v = { version: 1, docId: 'seed.northwind-rfp', hash: rfp.hash, charCount: rfp.text.length, excerpt: rfp.text.slice(0, 400), filename: 'northwind-rfp.md', format: 'markdown' as const, importedAt: t - 2 * 3600_000, importedBy: 'Seed' }
      return {
        'opp-northwind-rfp': {
          ...base,
          id: 'opp-northwind-rfp',
          projectId,
          title: 'AI-native design system programme (RFP)',
          task: 'rfp',
          requestKind: 'rfp',
          status: 'draft',
          step: 'context',
          createdAt: t - 2 * 3600_000,
          updatedAt: t - 2 * 3600_000,
          request: { original: v, versions: [v], current: 1 },
          context: { client: 'Northwind Retail', audience: 'Digital Product Office (design and engineering leads)', objective: 'Modernise the design system so people and AI tools build from one shared foundation, and so Northwind teams can run it after the engagement.', deliverable: 'Written answers to each question', dueDate: '14 November 2026' },
        },
      }
    }
    if (projectId === 'contoso') {
      const d = index['src-contoso-questionnaire']
      if (!d) return {}
      const v = { version: 1, docId: d.docId, hash: d.sourceHash, charCount: d.charCount, excerpt: d.excerpt, filename: 'contoso-vendor-questionnaire.md', format: 'markdown' as const, importedAt: t - 26 * 3600_000, importedBy: 'Seed' }
      return {
        'opp-contoso-questionnaire': {
          ...base,
          id: 'opp-contoso-questionnaire',
          projectId,
          title: 'Vendor questionnaire: three brands, one foundation',
          task: 'rfp',
          requestKind: 'questionnaire',
          status: 'draft',
          step: 'context',
          createdAt: t - 26 * 3600_000,
          updatedAt: t - 26 * 3600_000,
          request: { original: v, versions: [v], current: 1 },
          context: { client: 'Contoso Bank', audience: 'Procurement and the design-system lead', objective: '', deliverable: 'Questionnaire answers' },
        },
      }
    }
    return {}
  }
}
