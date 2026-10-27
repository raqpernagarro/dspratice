// The workspace's front door: one question, a prompt that routes to the right journey with no
// model call, and the journeys in two groups for anyone who would rather pick. Journeys are data
// (src/fixtures/journeys.ts); this page only shows them. Work in progress lives in Projects › My work.

import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import { practice } from '@/app/routes'
import { useIntegrations } from '@/integrations/status'
import { Chip, Segmented, Sheet } from '@/shell/ui'
import { JOURNEYS, JOURNEY_GROUPS, type JourneyDef, type JourneyGroup } from '@/fixtures/journeys'
import { matchJourneys } from './intent'
import { askAi, estimateAskTokens, type AskResult } from './askAi'
import { useInProgress } from './work'

const TRY = ['We got an RFP from a bank', 'Jane needs a prototype on the ASSA ABLOY design system', 'Show a prospect how AI stays on their system']

function JourneyRow({ j, reason }: { j: JourneyDef; reason?: string }) {
  return (
    <Link to={j.to} className="jrow" data-testid={`journey-${j.id}`}>
      <span className="jrow__main">
        <strong className="jrow__title">{j.title}</strong>
        <span className="jrow__outcome">{j.outcome}</span>
        {reason && <span className="jrow__reason">{reason}</span>}
      </span>
      {j.status === 'guide' && <Chip tone="outline">Guide</Chip>}
      <ArrowRight className="jrow__arrow" />
    </Link>
  )
}

function GroupCard({ group, onAll }: { group: JourneyGroup; onAll: () => void }) {
  const g = JOURNEY_GROUPS[group]
  const featured = JOURNEYS.filter((j) => j.group === group && j.featured)
  const total = JOURNEYS.filter((j) => j.group === group).length
  return (
    <section className={`jgroup jgroup--${group}`} aria-labelledby={`jgroup-${group}`} data-testid={`group-${group}`}>
      <span className="jgroup__tick" aria-hidden="true" />
      <h2 id={`jgroup-${group}`} className="jgroup__title">{g.title}</h2>
      <p className="jgroup__lead">{g.lead}</p>
      <div className="jgroup__rows">
        {featured.map((j) => (
          <JourneyRow key={j.id} j={j} />
        ))}
      </div>
      <button type="button" className="jgroup__all" onClick={onAll}>
        All {total} journeys <ArrowRight />
      </button>
    </section>
  )
}

function AllJourneys({ start, onClose }: { start: JourneyGroup | 'all'; onClose: () => void }) {
  const [filter, setFilter] = useState<JourneyGroup | 'all'>(start)
  const groups = (filter === 'all' ? (['clients', 'projects'] as const) : [filter]) as JourneyGroup[]
  return (
    <Sheet title="All journeys" onClose={onClose} wide>
      <Segmented ariaLabel="Group" value={filter} onChange={setFilter} options={[{ id: 'all', label: 'All' }, { id: 'clients', label: JOURNEY_GROUPS.clients.title }, { id: 'projects', label: JOURNEY_GROUPS.projects.title }]} />
      {groups.map((g) => (
        <section key={g} className="stack" style={{ marginTop: 20 }}>
          <h3 className="section-title">{JOURNEY_GROUPS[g].title}</h3>
          <div className="jgroup__rows jgroup__rows--plain">
            {JOURNEYS.filter((j) => j.group === g).map((j) => (
              <JourneyRow key={j.id} j={j} />
            ))}
          </div>
        </section>
      ))}
      <p className="small muted" style={{ marginTop: 16 }}>A guide has steps and links but no tool of its own yet.</p>
    </Sheet>
  )
}

export function NagarroHome() {
  const items = useInProgress()
  const status = useIntegrations()
  const [text, setText] = useState('')
  const [asked, setAsked] = useState('')
  const [all, setAll] = useState<JourneyGroup | 'all' | null>(null)
  const [ai, setAi] = useState<{ state: 'idle' | 'loading' | 'error'; result?: AskResult; error?: string }>({ state: 'idle' })
  const input = useRef<HTMLInputElement>(null)
  const matches = useMemo(() => matchJourneys(asked), [asked])

  const ask = (q: string) => {
    setText(q)
    setAsked(q.trim())
    setAi({ state: 'idle' })
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(text)
  }
  const runAi = async () => {
    setAi({ state: 'loading' })
    try {
      setAi({ state: 'idle', result: await askAi(asked) })
    } catch (e) {
      setAi({ state: 'error', error: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="page home home--v7">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__x" aria-hidden="true" />
        <div className="home-hero__loop" aria-hidden="true" />
        <div className="home-hero__inner">
          <p className="home-hero__kicker">Nagarro Design Workspace</p>
          <h1 id="home-title" className="home__title">
            What do you need to do?
          </h1>
          <p className="home__lead">Describe the job or pick one below, and go straight to the right material and tools.</p>

          <form className="ask" onSubmit={submit} role="search" aria-label="Describe what you need to do">
            <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="For example: we got an RFP from a bank" aria-label="What do you need to do?" data-testid="home-ask" />
            <button className="ask__send" type="submit" aria-label="Find the journey">
              <ArrowRight />
            </button>
          </form>
          <div className="ask__try">
            <span>Try</span>
            {TRY.map((t) => (
              <button key={t} type="button" onClick={() => ask(t)}>
                {t}
              </button>
            ))}
          </div>

          {asked && (
            <div className="ask__answer" aria-live="polite" data-testid="home-answer">
              {matches.length ? (
                <>
                  <p className="ask__who">{matches.length === 1 ? 'This journey fits' : 'These journeys fit, best first'}</p>
                  <div className="jgroup__rows jgroup__rows--plain">
                    {matches.map((m) => (
                      <JourneyRow key={m.journey.id} j={m.journey} reason={`Because you wrote: ${m.matched.slice(0, 3).join(', ') || m.journey.title.toLowerCase()}`} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="ask__none">Nothing matched those words exactly{status.model.configured ? '; Ask AI can try' : ''}. These are the jobs people start most:</p>
                  <div className="jgroup__rows jgroup__rows--plain" data-testid="home-closest">
                    {JOURNEYS.filter((j) => j.featured).slice(0, 4).map((j) => (
                      <JourneyRow key={j.id} j={j} />
                    ))}
                  </div>
                </>
              )}
              {status.model.configured && !ai.result && (
                <button type="button" className="btn btn--secondary btn--sm ask__ai" onClick={runAi} disabled={ai.state === 'loading'} data-testid="home-ask-ai">
                  <Sparkles /> {ai.state === 'loading' ? 'Asking…' : `Ask AI instead · about ${(estimateAskTokens(asked) / 1000).toFixed(1)}k tokens`}
                </button>
              )}
              {ai.state === 'error' && <p className="small" style={{ color: 'var(--n-err)' }}>{ai.error}</p>}
              {ai.result && (
                <div className="ask__ai-result">
                  <p className="ask__who">
                    <Sparkles /> AI suggestion · {ai.result.model} · {ai.result.usage.inputTokens + ai.result.usage.outputTokens} tokens
                  </p>
                  <p className="small">{ai.result.reason}</p>
                  <div className="jgroup__rows jgroup__rows--plain">
                    {ai.result.journeys.map((j) => (
                      <JourneyRow key={j.id} j={j} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="jgroups">
        <GroupCard group="clients" onAll={() => setAll('clients')} />
        <GroupCard group="projects" onAll={() => setAll('projects')} />
      </div>

      <Link to={practice.myWork} className="home__progress" data-testid="home-in-progress">
        {items.length ? (
          <>
            <strong>
              {items.length} thing{items.length > 1 ? 's' : ''} in progress
            </strong>{' '}
            <span className="muted">· latest: {items[0].title}, {items[0].client}</span>
          </>
        ) : (
          <span className="muted">Nothing in progress yet. Your requests, decks and set-ups will appear in My work.</span>
        )}
        <span className="home__progress-go">
          My work <ArrowRight />
        </span>
      </Link>

      {all && <AllJourneys start={all} onClose={() => setAll(null)} />}
    </div>
  )
}
