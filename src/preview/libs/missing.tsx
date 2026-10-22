// Stand-in for a preview library whose source repository is not on this machine. The hub runs
// without DSN or the DS Starter Pack; previews of their real components switch on once the
// sources are installed (npm run setup explains how).

import type { FrameParams } from '../protocol'
import type { ThemeIntents } from '@/library/theme/intents'

export const probeTokens: string[] = []

export function applyTheme(_doc: Document, _theme: ThemeIntents) {}

export function Root({ params }: { params: FrameParams; theme: ThemeIntents | undefined; props: Record<string, Record<string, unknown>>; onEvent: (id: string, name: string, detail?: unknown) => void }) {
  const name = params.lib === 'dsn' ? 'DSN (Rui Dias)' : 'DS Starter Pack (Nuno Almeida)'
  return (
    <div className="pv">
      <div className="pv__error" role="status">
        Library source not installed: {name}. Run <code>npm run setup</code> for how to add it. Everything else in the hub works without it.
      </div>
    </div>
  )
}
