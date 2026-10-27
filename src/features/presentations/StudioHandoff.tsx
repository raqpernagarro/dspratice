// The way on from a hub deck to Carolina Baptista's Presentation Studio, which edits decks on a
// canvas and exports .pptx and PDF. Studio has no import for the hub's deck.json yet, so the hand-off
// is the 12-point brief: copied here, pasted into Studio's prompt box.

import { useEffect, useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { exportBriefMd } from '@/deck/exports'
import { startCommand } from '@/fixtures/experiences'
import { CommandLine, RunChip } from '@/features/tools/ExperienceFrame'
import { useAddress, useTools } from '@/integrations/tools'
import { Btn, Panel } from '@/shell/ui'
import type { Deck } from '@/state/types'

export function StudioHandoff({ deck }: { deck: Deck }) {
  const address = useAddress('studio')
  const run = useTools((s) => s.run.studio)
  const check = useTools((s) => s.check)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    void check('studio')
  }, [check, address])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportBriefMd(deck).content)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <Panel title="Edit and export in Presentation Studio" actions={<RunChip state={run.state} />}>
      <p className="small">Studio drafts the deck again from this brief on the same Nagarro master slides. You edit it on a canvas and export editable PowerPoint (.pptx) or PDF. It uses your Claude CLI sign-in and takes a few minutes.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <Btn onClick={() => void copy()} data-testid="copy-brief-for-studio">
          <Copy /> {copied ? 'Brief copied' : 'Copy the brief'}
        </Btn>
        {run.state === 'up' && (
          <a className="btn btn--secondary" href={address} target="_blank" rel="noreferrer" data-testid="open-studio">
            <ExternalLink /> Open Presentation Studio
          </a>
        )}
      </div>
      {copied && <p className="small">Paste it into Studio’s prompt box, then choose Generate.</p>}
      {run.state === 'down' && (
        <div className="stack" style={{ gap: 6 }}>
          <span className="small muted">Studio is not running. Start it from the workspace folder:</span>
          <CommandLine cmd={startCommand('studio')} />
        </div>
      )}
      <p className="xs muted">Opening the workspace’s deck.json in Studio is not confirmed with Carolina yet, so Studio rebuilds the deck from the brief rather than importing these exact slides.</p>
    </Panel>
  )
}
