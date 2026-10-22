// The practice's fictional engagements. Demo Brand is the full showcase; the other three are lighter
// records with their own brand, package, stage, findings and publication state.

import type { ProjectSeed } from '@/state/types'
import { DEMO_COMPONENTS } from '@/fixtures/demo-brand/components'

const DAY = 24 * 60 * 60 * 1000
const T0 = Date.UTC(2026, 9, 21) // 21 Oct 2026, fixed so seeds are deterministic

const byCategory = (cats: string[]) => DEMO_COMPONENTS.filter((c) => cats.includes(c.category)).map((c) => c.id)

export const ALL_CHAPTERS = ['stand', 'found', 'one-truth', 'rule-to-fix', 'both-tools', 'ai-on-system', 'what-you-keep']
const chapters = (on: boolean) => Object.fromEntries(ALL_CHAPTERS.map((id) => [id, on]))

export const PROJECT_SEEDS: ProjectSeed[] = [
  {
    id: 'demo-brand',
    slug: 'demo-brand',
    client: { name: 'Demo Brand', sector: 'B2B software', fictional: true },
    engagement: { package: 'DS Accelerate', stage: 'adapting', startedAt: T0 - 40 * DAY, nextReview: '12 Dec', owner: 'Raquel Pereira', adapterVersion: '0.4.2', needsSpecialist: 'Drift rising since the v1.8 release; schedule a token readout.', notes: 'The full showcase. Every client chapter is available.' },
    theme: { name: 'Demo Brand' },
    componentIds: 'all',
    findingIds: 'all',
    publish: true,
    clientExperience: { enabled: true, chapters: chapters(true), guidanceDefault: 'meeting' },
  },
  {
    id: 'northwind',
    slug: 'northwind',
    client: { name: 'Northwind Retail', sector: 'Retail', fictional: true },
    engagement: { package: 'DS Build', stage: 'building', startedAt: T0 - 12 * DAY, nextReview: '5 Jan', owner: 'Raquel Pereira', adapterVersion: '0.4.2', notes: 'New system from the starter. Nothing published yet: the client experience opens once v1 is approved.' },
    theme: { name: 'Northwind', tagline: 'Retail operations, store to shelf.', color: { main: '#c2410c', accent: '#1f6feb', neutralTint: 0.03 }, radius: 12, productType: 'ecommerce', brands: [{ id: 'demo', name: 'Northwind', main: '#c2410c', accent: '#1f6feb', isDefault: true }] },
    componentIds: byCategory(['atoms', 'molecules']),
    findingIds: ['f-button-size-naming', 'f-card-guidance'],
    journey: { entryPath: 'new', wizardDone: true },
    publish: false,
    clientExperience: { enabled: false, chapters: chapters(false), guidanceDefault: 'none' },
  },
  {
    id: 'contoso',
    slug: 'contoso',
    client: { name: 'Contoso Bank', sector: 'Financial services', fictional: true },
    engagement: { package: 'DS Scale', stage: 'scaling', startedAt: T0 - 90 * DAY, nextReview: 'Now', owner: 'Raquel Pereira', adapterVersion: '0.3.9', needsSpecialist: 'Multi-brand rollout blocked on the Figma mode limit; needs an architecture call this week.', notes: 'Three brands on one contract. Assessment done; the full walkthrough is enabled for their design leads.' },
    theme: { name: 'Contoso', tagline: 'Banking for 40 million customers.', color: { main: '#1f3a93', accent: '#10b981', neutralTint: 0.05 }, radius: 4, density: 0.9, productType: 'dashboard', activeBrand: 'demo', brands: [{ id: 'demo', name: 'Contoso', main: '#1f3a93', accent: '#10b981', isDefault: true }, { id: 'gold', name: 'Contoso Private', main: '#c3921a', accent: '#1f6feb' }, { id: 'violet', name: 'Contoso Ventures', main: '#6b4ff5', accent: '#ff3e9d' }] },
    componentIds: 'all',
    findingIds: ['f-hover-dark', 'f-modal-dark', 'f-code-names'],
    journey: { entryPath: 'bring', connect: { repoUrl: 'github.com/contoso/ui-platform', figmaUrl: 'figma.com/design/… · Contoso UI', status: 'detected' }, scan: { status: 'done', completedAt: T0 - 60 * DAY, stageDetails: [] } },
    publish: true,
    clientExperience: { enabled: true, chapters: chapters(true), guidanceDefault: 'full' },
  },
  {
    id: 'fabrikam',
    slug: 'fabrikam',
    client: { name: 'Fabrikam Health', sector: 'Healthcare', fictional: true },
    engagement: { package: 'Support', stage: 'supporting', startedAt: T0 - 200 * DAY, nextReview: '20 Jan', owner: 'Raquel Pereira', adapterVersion: '0.4.2', notes: 'Handed over. Every finding resolved; the client runs the panel with a named owner.' },
    theme: { name: 'Fabrikam', tagline: 'Calm tools for care teams.', color: { main: '#2a8aa8', accent: '#1f6feb', neutralTint: 0.03 }, radius: 14, density: 1.15, productType: 'admin', brands: [{ id: 'demo', name: 'Fabrikam', main: '#2a8aa8', accent: '#1f6feb', isDefault: true }] },
    componentIds: byCategory(['atoms', 'molecules', 'organisms']).slice(0, 30),
    findingIds: 'all',
    journey: { entryPath: 'bring', connect: { repoUrl: 'github.com/fabrikam/care-ui', figmaUrl: 'figma.com/design/… · Fabrikam Care', status: 'detected' }, scan: { status: 'done', completedAt: T0 - 150 * DAY, stageDetails: [] } },
    fastForwarded: true,
    publish: true,
    clientExperience: { enabled: true, chapters: chapters(true), guidanceDefault: 'meeting' },
  },
]
