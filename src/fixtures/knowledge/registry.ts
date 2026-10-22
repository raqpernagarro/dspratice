// The curated seed collection. Metadata only: the text of each source is in docs/<slug>.doc.json
// (written by scripts/snapshot-local-sources.mjs and scripts/figma-json-to-doc.mjs), and the
// doc-derived fields (hash, outline, read date) come from docs/index.generated.json.
//
// Approval rule (Raquel, 22 Oct 2026): only sources with a recorded verdict start approved. The
// offer deck ("Use, canonical plans", 20 Oct), the Case Studies deck ("Use, evidence library", 20 Oct,
// internal until cleared per client) and the big idea (decided 21 Oct). Everything else is a draft
// with its owner until that owner approves it in the library.
// Pure module (relative imports only) so the snapshot scripts can read it.

import type { DocIndexEntry, KnowledgeSource } from '../../knowledge/types.ts'

type Meta = Omit<KnowledgeSource, 'bodyHistory' | 'outline' | 'registeredAt' | 'registeredBy' | 'seed' | 'docId' | 'sourceHash' | 'readAt' | 'readBy' | 'excerpt' | 'charCount'> & { slug: string }

const T20 = Date.UTC(2026, 9, 20)
const T21 = Date.UTC(2026, 9, 21)
const practice = { kind: 'practice' } as const
const RAQUEL = 'Raquel Pereira'
const NUNO = 'Nuno Almeida'
const RUI = 'Rui Dias'

export const SEED_REGISTRY_VERSION = 1

export const SEED_SOURCE_META: Meta[] = [
  // ---- Figma (captured through the Figma MCP, text only; see docs/figma-reading.md) ----
  { id: 'src-offer-deck', slug: 'offer-deck', title: 'Design Systems offer deck', kind: 'offering', scope: practice, location: { type: 'figma', fileKey: 'yeSjfdrvwG242j3zAauexZ', nodeIds: [], page: 'Offer Deck', label: 'Design Systems | Decks › Offer Deck' }, owner: RAQUEL, audience: 'client-safe', approval: 'approved', approvedBy: RAQUEL, approvedAt: T20, approvalNote: 'Verdict 20 Oct: use, canonical plans. Client frames (Understanding Charter) excluded at capture.', availability: 'not-read', tags: ['offering', 'packages', 'value', 'ai', 'design system', 'governance', 'business case'] },
  { id: 'src-case-studies', slug: 'case-studies', title: 'Case studies: design-system work (Verizon, Datto)', kind: 'case-study', scope: practice, location: { type: 'figma', fileKey: 'D31di4PFgMvTUzfRHuxYkP', nodeIds: [], label: 'Case Studies › 01.24.1 Verizon DS, 01.33.3 Datto DS' }, owner: 'Product Studio', audience: 'internal', approval: 'approved', approvedBy: RAQUEL, approvedAt: T20, approvalNote: 'Verdict 20 Oct: use as the evidence library. Internal until each case is cleared for the client in question.', availability: 'not-read', tags: ['case study', 'evidence', 'design system', 'ecosystems'] },
  { id: 'src-big-idea', slug: 'big-idea', title: 'Big idea and authority spine (FigJam Strategy page)', kind: 'point-of-view', scope: practice, location: { type: 'figjam', fileKey: 'yeiDcap30EfEY6aSa78VbX', nodeIds: ['453:8548', '478:1263'], label: 'DS-Practice › Strategy' }, owner: RAQUEL, audience: 'internal', approval: 'approved', approvedBy: RAQUEL, approvedAt: T21, approvalNote: 'Big idea line decided 21 Oct.', availability: 'not-read', tags: ['point of view', 'ai-native', 'ai-ready', 'positioning'] },
  { id: 'src-what-to-use-when', slug: 'what-to-use-when', title: 'What to use when (decision map)', kind: 'method', scope: practice, location: { type: 'figjam', fileKey: 'yeiDcap30EfEY6aSa78VbX', nodeIds: ['465:1771'], label: 'DS-Practice › Strategy › What to use when' }, owner: RAQUEL, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['method', 'situations', 'which offer', 'decision map'] },

  // ---- Local practice docs (read through the local server; snapshot with npm run knowledge:local) ----
  { id: 'src-battle-card', slug: 'battle-card', title: 'Battle card: AI-ready design systems', kind: 'method', scope: practice, location: { type: 'local', path: 'gtm/battle-card.md' }, owner: RAQUEL, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['offering', 'packages', 'discovery questions', 'triggers', 'objections'] },
  { id: 'src-authority-engine', slug: 'authority-engine', title: 'Authority engine (point of view and spine)', kind: 'point-of-view', scope: practice, location: { type: 'local', path: 'gtm/authority-engine.md' }, owner: RAQUEL, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['point of view', 'ai-native', 'ai-ready', 'positioning'] },
  { id: 'src-problem-bank', slug: 'problem-bank', title: 'Problem bank', kind: 'method', scope: practice, location: { type: 'local', path: 'gtm/problem-bank.md' }, owner: RAQUEL, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['method', 'problems', 'consent'] },
  { id: 'src-seller-training', slug: 'seller-training', title: 'Seller training: open the design-system conversation', kind: 'method', scope: practice, location: { type: 'local', path: 'gtm/seller-training-outline.md' }, owner: RAQUEL, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['enablement', 'training', 'sellers', 'demo'] },
  { id: 'src-ask-the-account', slug: 'ask-the-account', title: 'Ask the account (client-manager route)', kind: 'method', scope: practice, location: { type: 'local', path: 'gtm/ask-the-account.md' }, owner: RAQUEL, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['method', 'account', 'discovery'] },
  { id: 'src-decision-brief', slug: 'decision-brief', title: 'Product scoping: decision brief (proposal for 12 Nov)', kind: 'approach', scope: practice, location: { type: 'local', path: 'product-scoping/decision-brief.md' }, owner: RAQUEL, audience: 'internal', approval: 'draft', approvalNote: 'A proposal, not a decision, until the 12 Nov session.', availability: 'not-read', tags: ['approach', 'control panel', 'service', 'mvp'] },
  { id: 'src-scoping-analysis', slug: 'scoping-analysis', title: 'Product scoping: analysis', kind: 'approach', scope: practice, location: { type: 'local', path: 'product-scoping/analysis.md' }, owner: RAQUEL, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['approach', 'governance', 'users', 'architecture'] },
  { id: 'src-market-trends', slug: 'market-trends', title: 'Market trends 2026: design systems and AI', kind: 'resource', scope: practice, location: { type: 'local', path: 'product-scoping/market-trends.md' }, owner: RAQUEL, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['market', 'trends', 'service lines', 'ai'] },
  { id: 'src-feasibility', slug: 'feasibility', title: 'Feasibility experiment (Stage 0 and Stage 1)', kind: 'method', scope: practice, location: { type: 'local', path: 'product-scoping/feasibility-experiment.md' }, owner: RAQUEL, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['method', 'experiment', 'assessment'] },
  { id: 'src-evidence-index', slug: 'evidence-index', title: 'Evidence index (claims about our three solutions)', kind: 'resource', scope: practice, location: { type: 'local', path: 'product-scoping/evidence-index.md' }, owner: RAQUEL, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['evidence', 'dsn', 'starter pack', 'counts'] },
  { id: 'src-offering-v03', slug: 'offering-v03', title: 'AI-ready design systems offering v0.3 (HTML)', kind: 'offering', scope: practice, location: { type: 'local', path: 'AI-Ready-Design-Systems-Offering 3.html' }, owner: RAQUEL, audience: 'internal', approval: 'outdated', approvalNote: 'Uses the old package names (Diagnostic, Cornerstone, Grow, Revamp & Unify), renamed on 19 Oct. Kept to show where older material disagrees.', availability: 'not-read', tags: ['offering', 'packages', 'old names'] },

  // ---- Nuno Almeida: DS Starter Pack ----
  { id: 'src-starter-readme', slug: 'starter-readme', title: 'DS Starter Pack: README', kind: 'resource', scope: practice, location: { type: 'local', path: 'demo tools/ds-starter-pack-main/README.md' }, owner: NUNO, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['starter pack', 'base ui', 'configurator', 'tokens', 'figma plugin'] },
  { id: 'src-starter-llms', slug: 'starter-llms', title: 'DS Starter Pack: llms.txt (what agents read)', kind: 'resource', scope: practice, location: { type: 'local', path: 'demo tools/ds-starter-pack-main/llms.txt' }, owner: NUNO, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['starter pack', 'ai', 'agents', 'machine-readable'] },
  { id: 'src-starter-token-sync', slug: 'starter-token-sync', title: 'DS Starter Pack: design tokens and Figma sync', kind: 'method', scope: practice, location: { type: 'local', path: 'demo tools/ds-starter-pack-main/docs/DESIGN_TOKENS_AND_FIGMA_SYNC.md' }, owner: NUNO, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['tokens', 'figma', 'sync', 'governance'] },

  // ---- Rui Dias: DSN ----
  { id: 'src-dsn-readme', slug: 'dsn-readme', title: 'DSN: README', kind: 'resource', scope: practice, location: { type: 'local', path: 'demo tools/DSN-main/README.md' }, owner: RUI, audience: 'internal', approval: 'outdated', approvalNote: 'Known to disagree with the code (styling library, npm package); see the evidence index.', availability: 'not-read', tags: ['dsn', 'ai-first', 'component library'] },
  { id: 'src-dsn-agents', slug: 'dsn-agents', title: 'DSN: AGENTS.md (building guide for agents)', kind: 'method', scope: practice, location: { type: 'local', path: 'demo tools/DSN-main/AGENTS.md' }, owner: RUI, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['dsn', 'agents', 'machine-readable', 'governance', 'tokens'] },
  { id: 'src-dsn-ai-short', slug: 'dsn-ai-short', title: 'DSN: AI usage guide (short)', kind: 'method', scope: practice, location: { type: 'local', path: 'demo tools/DSN-main/AI-short.md' }, owner: RUI, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['dsn', 'ai', 'usage rules'] },
  { id: 'src-dsn-llms', slug: 'dsn-llms', title: 'DSN: llms.txt', kind: 'resource', scope: practice, location: { type: 'local', path: 'demo tools/DSN-main/llms.txt' }, owner: RUI, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['dsn', 'ai', 'machine-readable'] },
  { id: 'src-dsn-figma-mcp', slug: 'dsn-figma-mcp', title: 'DSN: Figma MCP instructions', kind: 'method', scope: practice, location: { type: 'local', path: 'demo tools/DSN-main/docs/figma-mcp-instructions.md' }, owner: RUI, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['figma', 'mcp', 'agents'] },

  // ---- Pointers: registered, not read ----
  { id: 'src-handbook', slug: 'handbook', title: 'DS Handbook (site)', kind: 'resource', scope: practice, location: { type: 'url', url: 'https://ds-handbook.vercel.app' }, owner: RUI, audience: 'client-safe', approval: 'draft', availability: 'not-read', availabilityMessage: 'Links are registered, not read.', tags: ['handbook', 'guidance'] },
  { id: 'src-capability-page', slug: 'capability-page', title: 'nagarro.com: AI-ready design systems', kind: 'offering', scope: practice, location: { type: 'url', url: 'https://www.nagarro.com/en/services/design-studio/ai-ready-design-systems' }, owner: 'Marketing', audience: 'public', approval: 'approved', approvedBy: RAQUEL, approvedAt: T20, approvalNote: 'Published on nagarro.com.', availability: 'not-read', availabilityMessage: 'Links are registered, not read.', tags: ['offering', 'public'] },
  { id: 'src-noel-blog', slug: 'noel-blog', title: 'Designing AI-ready systems (Noel Cunningham)', kind: 'point-of-view', scope: practice, location: { type: 'url', url: 'https://www.nagarro.com/en/blog/designing-ai-ready-systems' }, owner: 'Noel Cunningham', audience: 'public', approval: 'approved', approvedBy: RAQUEL, approvedAt: T20, approvalNote: 'Published on nagarro.com.', availability: 'not-read', availabilityMessage: 'Links are registered, not read.', tags: ['point of view', 'public'] },
  { id: 'src-figma-ai-report', slug: 'figma-ai-report', title: "Figma's 2026 AI Report (PDF)", kind: 'resource', scope: practice, location: { type: 'local', path: "Figma's 2026 AI Report.pdf" }, owner: 'Figma', audience: 'internal', approval: 'draft', availability: 'unsupported', availabilityMessage: '17 MB PDF, above the 15 MB upload limit; not ingested. Upload a shorter extract.', tags: ['market', 'ai'] },
  { id: 'src-ai-native-org', slug: 'ai-native-org', title: 'The guide to building an AI-native org (PDF)', kind: 'resource', scope: practice, location: { type: 'local', path: 'The guide to building an AI-native org.pdf' }, owner: 'Figma', audience: 'internal', approval: 'draft', availability: 'unsupported', availabilityMessage: '17 MB PDF, above the 15 MB upload limit; not ingested.', tags: ['ai-native', 'organisation'] },
  { id: 'src-repo-dsn', slug: 'repo-dsn', title: 'DSN repository (GitHub, private)', kind: 'resource', scope: practice, location: { type: 'repo', url: 'https://github.com/nagarro-dv/DSN' }, owner: RUI, audience: 'internal', approval: 'draft', availability: 'inaccessible', availabilityMessage: 'Private repository; this machine has no access. Its docs are read from the local copy instead.', tags: ['dsn'] },
  { id: 'src-repo-starter', slug: 'repo-starter', title: 'DS Starter Pack repository (GitHub, private)', kind: 'resource', scope: practice, location: { type: 'repo', url: 'https://github.com/nagarro-dv/ds-starter-pack' }, owner: NUNO, audience: 'internal', approval: 'draft', availability: 'inaccessible', availabilityMessage: 'Private repository; this machine has no access. Its docs are read from the local copy instead.', tags: ['starter pack'] },
  { id: 'src-figma-decks-team', slug: 'figma-decks-team', title: 'Figma team "Decks" (folder discovery)', kind: 'deck', scope: practice, location: { type: 'figma-folder', teamId: '1587507004059459999', label: 'Figma › Decks team' }, owner: 'Product Studio', audience: 'internal', approval: 'draft', availability: 'not-read', availabilityMessage: 'Listing a Figma folder needs a REST token; the Figma MCP cannot list folders.', tags: ['decks', 'folder'] },
  { id: 'src-figma-proposals-team', slug: 'figma-proposals-team', title: 'Figma team "Product Studio – Proposals" (folder discovery)', kind: 'proposal-section', scope: practice, location: { type: 'figma-folder', teamId: '1204114919783221972', label: 'Figma › Product Studio – Proposals' }, owner: 'Product Studio', audience: 'internal', approval: 'draft', availability: 'not-read', availabilityMessage: 'Holds client proposals: register individual files as client-scoped, never as practice material.', tags: ['proposals', 'folder', 'client ip'] },

  // ---- Client-scoped samples (fictional) that prove isolation ----
  { id: 'src-contoso-questionnaire', slug: 'contoso-questionnaire', title: 'Contoso Bank: vendor questionnaire (sample)', kind: 'request', scope: { kind: 'client', projectId: 'contoso', reusable: false }, location: { type: 'upload', filename: 'contoso-vendor-questionnaire.md', mime: 'text/markdown' }, owner: RAQUEL, audience: 'internal', approval: 'draft', availability: 'not-read', tags: ['contoso', 'questionnaire'] },
  { id: 'src-contoso-multibrand-note', slug: 'contoso-multibrand-note', title: 'Three brands on one foundation (reusable note, sample)', kind: 'proposal-section', scope: { kind: 'client', projectId: 'contoso', reusable: true, reuseApprovedBy: RAQUEL, reuseApprovedAt: T21 }, location: { type: 'upload', filename: 'multibrand-governance-note.md', mime: 'text/markdown' }, owner: RAQUEL, audience: 'client-safe', approval: 'approved', approvedBy: RAQUEL, approvedAt: T21, approvalNote: 'Written for Contoso, anonymised and approved for reuse with other clients.', availability: 'not-read', tags: ['multibrand', 'governance', 'brands', 'tokens'] },
]

/** Merges the metadata with the generated document index. */
export function buildSeedSources(index: Record<string, DocIndexEntry>, t = T21): KnowledgeSource[] {
  return SEED_SOURCE_META.map(({ slug, ...m }) => {
    void slug
    const d = index[m.id]
    return {
      ...m,
      seed: true,
      bodyHistory: [],
      registeredAt: t,
      registeredBy: 'Seed',
      outline: d?.outline ?? [],
      ...(d ? { docId: d.docId, sourceHash: d.sourceHash, readAt: d.readAt, readBy: d.readBy, excerpt: d.excerpt, charCount: d.charCount, availability: 'available' as const, availabilityMessage: undefined } : {}),
      ...(!d && m.availability === 'not-read' && m.location.type !== 'url' ? { availabilityMessage: m.availabilityMessage ?? 'Not captured in the bundled snapshot yet.' } : {}),
    }
  })
}

export function seedSlug(id: string) {
  return SEED_SOURCE_META.find((m) => m.id === id)?.slug ?? id.replace(/^src-/, '')
}
