// Improve journey, step 1: what the client wants from the work. Stored with the journey as
// preparation (it never changes the client demo), and read back by the readout and the report.

import { ArrowRight } from 'lucide-react'
import { act, useProject, useSys } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Field, Panel } from '@/shell/ui'
import { cx } from '@/shell/ui'
import { useImproveNav } from './JourneyFrame'

export const GOAL_OPTIONS = [
  { id: 'consistency', label: 'Figma and code match', hint: 'Designers and developers see the same components and values.' },
  { id: 'speed', label: 'Teams ship faster', hint: 'Less rework, fewer one-off components.' },
  { id: 'ai', label: 'AI tools build on the system', hint: 'Generated screens use real components and tokens.' },
  { id: 'brands', label: 'Several brands on one foundation', hint: 'Themes instead of copies.' },
  { id: 'a11y', label: 'Accessibility by default', hint: 'Contrast and states checked on every change.' },
  { id: 'governance', label: 'Clear ownership and review', hint: 'Who decides, and how changes are approved.' },
]

type GoalsData = { goals?: string[]; products?: string; owner?: string; constraints?: string }

export function Goals() {
  const project = useProject()
  const data = useSys((s) => s.journey.improve.data) as GoalsData
  const ownerDefault = useSys((s) => s.people.find((p) => p.id === 'p-owner')?.name ?? '')
  const nav = useImproveNav('goals')
  const goals = data.goals ?? []
  const set = (key: keyof GoalsData, value: unknown) => act().setJourneyData('improve', key, value)
  const owner = data.owner ?? ownerDefault
  const ready = goals.length > 0 && owner.trim().length > 0

  return (
    <div className="page">
      <PageHead noTabs title="What does the client want from this work?" lead={`Write down ${project.client.name}’s goals in their words. Every later step, the readout and the assessment report come back to this.`} />
      <Panel title="Goals" actions={<span className="xs muted">Choose at least one</span>}>
        <div className="grid grid--3">
          {GOAL_OPTIONS.map((g) => {
            const on = goals.includes(g.id)
            return (
              <button key={g.id} className={cx('choice', on && 'is-selected')} aria-pressed={on} onClick={() => set('goals', on ? goals.filter((x) => x !== g.id) : [...goals, g.id])}>
                <div className="choice__body">
                  <span className="choice__title">{g.label}</span>
                  <span className="choice__desc">{g.hint}</span>
                </div>
              </button>
            )
          })}
        </div>
      </Panel>
      <Panel>
        <div className="grid grid--2">
          <Field label="Products and platforms" hint="For example: web shop in React, store app in Angular. Stacks other than React need a specialist to plan.">
            <input className="input" value={data.products ?? ''} onChange={(e) => set('products', e.target.value)} placeholder="Web shop (React), store operations app (Angular)" />
          </Field>
          <Field label="Who will own the system?" hint="The person on the client side who approves changes. A named owner is the best predictor that a system lasts.">
            <input className="input" value={owner} onChange={(e) => set('owner', e.target.value)} placeholder="Name and role" />
          </Field>
        </div>
        <Field label="Constraints or deadlines" hint="Optional. Releases, freezes, teams that cannot change yet.">
          <textarea className="input" rows={3} value={data.constraints ?? ''} onChange={(e) => set('constraints', e.target.value)} />
        </Field>
      </Panel>
      <div className="row row--between">
        <span className="small muted">{ready ? 'Saved as you type.' : 'Choose a goal and name the owner to finish this step.'}</span>
        <Btn onClick={nav.complete} disabled={!ready} data-testid="goals-continue">
          Save and connect their files <ArrowRight />
        </Btn>
      </div>
    </div>
  )
}
