// Understandable progress for real tasks and simulations alike (same Job shape): each stage in
// plain words, the current one spinning, failures explained.
import type { ReactNode } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import type { Job } from '@/state/types'
import { Callout, Panel, cx } from './ui'

export function ProgressPanel({ title, explain, stages, job, action, mode, done }: { title: string; explain?: ReactNode; stages: string[]; job?: Job; action?: ReactNode; mode?: ReactNode; done?: ReactNode }) {
  const running = job?.status === 'running'
  const idx = job ? job.stageIndex : -1
  return (
    <Panel title={title} actions={mode}>
      {explain && <p className="muted small">{explain}</p>}
      <ol className="steps" aria-live="polite">
        {(job?.stages.map((s) => s.label) ?? stages).map((label, i) => {
          const state = !job ? 'pending' : job.status === 'done' ? 'done' : i < idx ? 'done' : i === idx ? (job.status === 'failed' ? 'failed' : running ? 'active' : 'pending') : 'pending'
          return (
            <li key={label} className={cx('step', state === 'done' && 'is-done', state === 'active' && 'is-active', state === 'failed' && 'is-failed')}>
              <span className="step__dot">{state === 'done' ? <Check /> : state === 'active' ? <Loader2 className="spin" /> : state === 'failed' ? <X /> : i + 1}</span>
              <span className="step__body">
                <span className="step__title">{label}</span>
                {state === 'active' && <span className="step__detail">Working…</span>}
              </span>
            </li>
          )
        })}
      </ol>
      {job?.status === 'failed' && <Callout tone="err">{job.error ?? 'Something went wrong.'}</Callout>}
      {job?.status === 'done' && done}
      {action && <div className="row" style={{ gap: 8, marginTop: 12 }}>{action}</div>}
    </Panel>
  )
}
