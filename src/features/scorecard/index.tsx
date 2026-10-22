import { useState } from 'react'
import { Printer, RotateCcw, ExternalLink } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Chip, Panel, Progress, cx } from '@/shell/ui'
import { DIMENSIONS, QUESTIONS, score, type Dimension } from './model'

const OFFICIAL = 'https://www.nagarro.com/en/services/design-studio/ai-ready-design-systems'

export function Scorecard() {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const done = Object.keys(answers).length === QUESTIONS.length
  const r = score(answers)
  return (
    <div className="stack scorecard">
      <div className="row row--between no-print">
        <span className="small muted">{Object.keys(answers).length} of {QUESTIONS.length} answered · nothing you choose leaves this page</span>
        <button className="btn btn--ghost btn--sm" onClick={() => setAnswers({})}><RotateCcw /> Start again</button>
      </div>
      {QUESTIONS.map((q, i) => (
        <Panel key={q.id} title={`${i + 1}. ${q.text}`} actions={<span className="xs muted">{DIMENSIONS[q.dimension].label}</span>}>
          <div className="grid grid--4 scorecard__answers" role="radiogroup" aria-label={q.text}>
            {q.answers.map((a, v) => (
              <button key={a} role="radio" aria-checked={answers[q.id] === v} className={cx('choice', answers[q.id] === v && 'is-selected')} onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: v }))} data-testid={`sc-${q.id}-${v}`}>
                <span className="choice__body"><span className="choice__title small">{a}</span></span>
              </button>
            ))}
          </div>
        </Panel>
      ))}
      {done && (
        <div className="panel panel--ink scorecard__result" data-testid="scorecard-result">
          <div className="small" style={{ opacity: 0.8 }}>Your AI-readiness</div>
          <h2 style={{ margin: '4px 0' }}>Level {r.level} of 5 · {r.label}</h2>
          <div className="grid grid--2" style={{ marginTop: 12 }}>
            <div className="stack">
              {(Object.keys(DIMENSIONS) as Dimension[]).map((d) => (
                <div key={d}>
                  <div className="row row--between small"><span>{DIMENSIONS[d].label}</span><span>{Math.round((r.byDimension[d] / 3) * 100)}%</span></div>
                  <Progress value={(r.byDimension[d] / 3) * 100} mint />
                </div>
              ))}
            </div>
            <div className="stack">
              <div>
                <strong>Where to start</strong>
                <ol className="small">{r.weakest.map((d) => <li key={d}><strong>{DIMENSIONS[d].label}.</strong> {DIMENSIONS[d].advice}</li>)}</ol>
              </div>
              <div>
                <strong>A first step that fits</strong>
                <p className="small">Begin with the <strong>{r.first}</strong>: where your system stands, what keeps AI off-system, and a readout. Likely next: <strong>{r.then}</strong>. {r.why}</p>
              </div>
            </div>
          </div>
          <div className="row no-print" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <a className="btn btn--mint" href={OFFICIAL} target="_blank" rel="noreferrer"><ExternalLink /> Book a 30-minute readout</a>
            <button className="btn btn--on-dark-ghost" onClick={() => window.print()}><Printer /> Print or save as PDF</button>
          </div>
          <p className="xs" style={{ opacity: 0.7 }}>A self-assessment for conversation, not a measurement. The official AI-readiness assessment is on nagarro.com.</p>
        </div>
      )}
    </div>
  )
}

export function ScorecardPage() {
  return (
    <div className="page page--narrow">
      <PageHead screen="scorecard" title="AI-readiness scorecard" lead="Ten questions, five minutes: where your design system stands for AI, and a first step that fits. Do it together, live." eyebrow={<Chip tone="mint">Client-safe · nothing is sent</Chip>} />
      <Scorecard />
    </div>
  )
}
