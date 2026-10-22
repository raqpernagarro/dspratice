import { useNavigate } from 'react-router'
import { ArrowRight, Eye, GitBranch, Wand2 } from 'lucide-react'
import { useStore } from '@/state/store'
import { usePaths, useProject, useSys } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Chip, Callout } from '@/shell/ui'

export function ChoosePath() {
  const navigate = useNavigate()
  const r = usePaths()
  const project = useProject()
  const choose = useStore((s) => s.chooseEntryPath)
  const entry = useSys((s) => s.journey.entryPath)
  const wizardDone = useSys((s) => s.journey.wizardDone)
  const scanDone = useSys((s) => s.journey.scan.status === 'done')

  const go = (p: 'new' | 'bring' | 'explore', to: string) => {
    choose(p)
    navigate(to)
  }

  return (
    <div className="page page--narrow">
      <PageHead screen="choose" title="Set up your design system" lead="Pick a path. Nothing changes in your repository until you approve a pull request." />

      <div className="stack">
        <button className={`choice ${entry === 'new' ? 'is-selected' : ''}`} onClick={() => go('new', r.journeyNew())}>
          <Wand2 style={{ width: 20, color: 'var(--n-ai)' }} />
          <div className="choice__body">
            <span className="choice__title">
              Start new <Chip tone="mint">Recommended</Chip> {wizardDone && <Chip tone="ok">Wizard done</Chip>}
            </span>
            <span className="choice__desc">Template + set-up wizard. For no system, or one too broken to build on. Ends with a Figma change set and the panel on the same repository. DS Build.</span>
          </div>
          <ArrowRight style={{ width: 16, color: 'var(--n-fg-subtle)', alignSelf: 'center' }} />
        </button>

        <button className={`choice ${entry === 'bring' ? 'is-selected' : ''}`} onClick={() => go('bring', r.journeyImprove(2))}>
          <GitBranch style={{ width: 20, color: 'var(--n-info)' }} />
          <div className="choice__body">
            <span className="choice__title">Bring your system {scanDone && <Chip tone="ok">Scanned</Chip>}</span>
            <span className="choice__desc">Connect your repository and Figma file, read-only. We scan it first, agree a plan in the readout, then adapt it to the contract. 2-week AI audit → DS Accelerate or DS Scale.</span>
          </div>
          <ArrowRight style={{ width: 16, color: 'var(--n-fg-subtle)', alignSelf: 'center' }} />
        </button>

        <button className={`choice ${entry === 'explore' ? 'is-selected' : ''}`} onClick={() => go('explore', `/share/${project.slug}`)}>
          <Eye style={{ width: 20, color: 'var(--n-fg-muted)' }} />
          <div className="choice__body">
            <span className="choice__title">Explore the demo brand</span>
            <span className="choice__desc">Read-only, for sales conversations. Opens the client share view.</span>
          </div>
          <ArrowRight style={{ width: 16, color: 'var(--n-fg-subtle)', alignSelf: 'center' }} />
        </button>
      </div>

      <Callout tone="info">
        Supported profile today: React + JSON tokens + Figma variables. Other stacks get tokens and rules only; component work stays a service task. The Connect screen checks this and says so.
      </Callout>
    </div>
  )
}
