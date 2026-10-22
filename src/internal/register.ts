// Registers the internal-only seed data (knowledge library and sample opportunities) before the
// store is created. The client-safe demo build swaps this module for register.demo.ts, so none of
// it reaches the public bundle (vite.config.ts, scripts/check-demo-build.mjs).

import { registerInternalSeeds } from '@/state/internal-seeds'
import { buildSeedSources } from '@/fixtures/knowledge/registry'
import { SEED_CONFLICTS } from '@/fixtures/knowledge/conflicts'
import { seedOpportunities } from '@/fixtures/knowledge/opportunities'
import docIndex from '@/fixtures/knowledge/docs/index.generated.json'
import type { DocIndexEntry } from '@/knowledge/types'
import { setOtherClientDenylist } from '@/opportunity/rules'
import { OTHER_CLIENT_DENYLIST } from './denylist'

const index = docIndex as unknown as Record<string, DocIndexEntry>

registerInternalSeeds({
  sources: buildSeedSources(index),
  knowledge: () => ({ overrides: {}, custom: {}, hidden: [], conflicts: Object.fromEntries(SEED_CONFLICTS.map((c) => [c.id, JSON.parse(JSON.stringify(c))])), activity: [] }),
  opportunities: seedOpportunities(index),
})

setOtherClientDenylist(OTHER_CLIENT_DENYLIST)
