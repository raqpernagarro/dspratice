import { ArrowCounterClockwise, Check, CircleNotch, Key, PaperPlaneRight, Sparkle, Stop, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { withModeIntents, type ThemeConfig } from '../../../stories/base-ui/tokens/theme-config'
import { appType } from '../app/appTypes'
import { useApp, useProject } from '../app/AppContext'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { explainError, runToolLoop } from './client'
import { THEME_PRESETS, type ThemePreset } from './presets'
import {
  applyProposal,
  describeChanges,
  sanitizeProposal,
  THEME_STAGES,
  THEME_TOOLS,
  themeSystemPrompt,
  themeUserPrompt,
  type Change,
  type StageId,
  type ThemeProposal,
} from './themeAgent'

type StageStatus = 'pending' | 'running' | 'done'
interface Stage {
  id: StageId
  label: string
  status: StageStatus
  message?: string
}

interface Run {
  phase: 'running' | 'done' | 'error'
  source: 'agent' | 'preset'
  brief: string
  stages: Stage[]
  startedAt: number
  doneAt?: number
  error?: string
  summary?: string
  changes?: Change[]
  previous?: ThemeConfig
}

const EXAMPLES = ['Make it look like Cartoon Network', 'A calm, trustworthy healthcare app', 'Dense and precise, for a trading dashboard', 'Same, but in dark mode']

const freshStages = (): Stage[] => THEME_STAGES.map((s, i) => ({ id: s.id, label: s.label, status: i === 0 ? 'running' : 'pending' }))

/** Marks `stage` done with its message; earlier stages done; the next one running. */
function advance(stages: Stage[], stage: StageId, message?: string): Stage[] {
  const at = stages.findIndex((s) => s.id === stage)
  if (at < 0) return stages
  return stages.map((s, i) =>
    i < at ? { ...s, status: 'done' } : i === at ? { ...s, status: 'done', message: message ?? s.message } : i === at + 1 && s.status === 'pending' ? { ...s, status: 'running' } : s,
  )
}

function useTicker(active: boolean) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = window.setInterval(() => setTick((n) => n + 1), 500)
    return () => window.clearInterval(t)
  }, [active])
}

function Progress({ run }: { run: Run }) {
  useTicker(run.phase === 'running')
  const total = THEME_STAGES.length + 1
  const done = run.stages.filter((s) => s.status === 'done').length + (run.phase === 'done' ? 1 : 0)
  const pct = Math.round((done / total) * 100)
  const elapsed = ((run.doneAt ?? Date.now()) - run.startedAt) / 1000
  let eta = run.source === 'agent' ? 'Usually 20 to 60 seconds' : 'A few seconds'
  if (run.phase === 'done') eta = `Done in ${Math.max(1, Math.round(elapsed))} s`
  else if (run.phase === 'error') eta = 'Stopped'
  else if (done > 0) eta = `About ${Math.max(1, Math.round((elapsed / done) * (total - done)))} s left`
  return (
    <div className="agent-progress">
      <div className="agent-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Agent progress">
        <span style={{ width: `${Math.max(pct, run.phase === 'running' ? 4 : 0)}%` }} />
      </div>
      <div className="agent-progress__meta">
        <span>{pct}%</span>
        <span>{eta}</span>
      </div>
    </div>
  )
}

function Timeline({ stages }: { stages: Stage[] }) {
  return (
    <ol className="agent-timeline" aria-live="polite">
      {stages.map((s) => (
        <li key={s.id} className={`agent-timeline__item is-${s.status}`}>
          <span className="agent-timeline__icon" aria-hidden="true">
            {s.status === 'done' ? <Check size={11} weight="bold" /> : s.status === 'running' ? <CircleNotch size={12} weight="bold" className="spin" /> : null}
          </span>
          <div>
            <strong>{s.label}</strong>
            {s.message ? <p>{s.message}</p> : s.status === 'running' ? <p className="agent-timeline__wait">Working on it…</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}

function ChangeList({ changes }: { changes: Change[] }) {
  if (!changes.length) return <p className="agent-muted">Nothing needed to change.</p>
  return (
    <ul className="agent-changes">
      {changes.map((c) => (
        <li key={c.label}>
          <span className="agent-changes__label">{c.label}</span>
          <span className="agent-changes__values">
            {c.swatch?.[0] ? <i style={{ background: c.swatch[0] }} /> : null}
            {c.before ? (
              <>
                <s>{c.before}</s>
                <span aria-hidden="true">→</span>
              </>
            ) : null}
            {c.swatch?.[1] ? <i style={{ background: c.swatch[1] }} /> : null}
            <b>{c.after}</b>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function ThemeAgentPanel({ onClose }: { onClose: () => void }) {
  const { agent, setSettingsOpen } = useApp()
  const { doc, update } = useProject()
  const { theme, replaceTheme } = useSemanticEditor()
  const [brief, setBrief] = useState('')
  const [run, setRun] = useState<Run | null>(null)
  const abort = useRef<AbortController | null>(null)
  const themeRef = useRef(theme)
  themeRef.current = theme

  const finish = useCallback(
    (proposal: ThemeProposal, source: Run['source']) => {
      const previous = themeRef.current
      const next = applyProposal(previous, proposal)
      replaceTheme(next)
      setRun((r) =>
        r && {
          ...r,
          phase: 'done',
          doneAt: Date.now(),
          stages: r.stages.map((s) => ({ ...s, status: 'done' })),
          summary: proposal.summary,
          changes: describeChanges(withModeIntents(previous), withModeIntents(next), proposal.extras),
          previous,
          source,
        },
      )
    },
    [replaceTheme],
  )

  const runAgent = useCallback(
    async (text: string) => {
      const ask = text.trim()
      if (!ask) return
      abort.current?.abort()
      const controller = new AbortController()
      abort.current = controller
      setRun({ phase: 'running', source: 'agent', brief: ask, stages: freshStages(), startedAt: Date.now() })
      const t = appType(doc.info.appType)
      const projectLine = `Project: “${doc.info.name}”, a ${t.name.toLowerCase()} (${t.description.toLowerCase()})${doc.info.description ? `: ${doc.info.description}` : ''}.`
      try {
        const { finish: result } = await runToolLoop({
          settings: agent.run,
          system: themeSystemPrompt(),
          prompt: themeUserPrompt(ask, themeRef.current, projectLine),
          tools: THEME_TOOLS,
          finishTool: 'apply_theme',
          signal: controller.signal,
          effort: 'medium',
          onToolCall: (call) => {
            if (call.name === 'report_progress' && typeof call.input.stage === 'string') {
              setRun((r) => r && { ...r, stages: advance(r.stages, call.input.stage as StageId, String(call.input.message ?? '')) })
            }
          },
        })
        if (!result) throw new Error('The agent finished without a theme. Try describing the look differently.')
        finish(sanitizeProposal(result), 'agent')
      } catch (e) {
        setRun((r) => r && { ...r, phase: 'error', doneAt: Date.now(), error: explainError(e) })
      }
    },
    [doc.info, agent.run, finish],
  )

  const runPreset = useCallback(
    async (preset: ThemePreset) => {
      abort.current?.abort()
      const controller = new AbortController()
      abort.current = controller
      setRun({ phase: 'running', source: 'preset', brief: preset.name, stages: freshStages(), startedAt: Date.now() })
      for (const stage of THEME_STAGES) {
        await new Promise((r) => setTimeout(r, 380))
        if (controller.signal.aborted) return
        setRun((r) => r && { ...r, stages: advance(r.stages, stage.id, preset.steps[stage.id]) })
      }
      finish(preset.proposal, 'preset')
    },
    [finish],
  )

  // A brief written in "Set up system" runs once, the first time Edit theme opens with the agent
  // connected. It waits while the connection is still being checked, so the plan can run it.
  const pendingHandled = useRef(false)
  useEffect(() => {
    if (pendingHandled.current || !doc.pendingPrompt || agent.pending) return
    pendingHandled.current = true
    setBrief(doc.pendingPrompt)
    if (agent.ready) {
      update({ pendingPrompt: null })
      runAgent(doc.pendingPrompt)
    }
  }, [doc.pendingPrompt, agent.ready, agent.pending, runAgent, update])

  useEffect(() => () => abort.current?.abort(), [])

  const running = run?.phase === 'running'

  return (
    <aside className="agent-panel" aria-label="Styling agent">
      <header className="agent-panel__head">
        <span className="agent-panel__badge" aria-hidden="true">
          <Sparkle size={14} weight="fill" />
        </span>
        <div>
          <h2>Describe the look</h2>
          <p>The agent sets color, type, shape and depth for you.</p>
        </div>
        <button type="button" className="ui-icon-btn" onClick={onClose} aria-label="Close agent">
          <X size={14} weight="bold" />
        </button>
      </header>

      <div className="agent-panel__body">
        <form
          className="agent-ask"
          onSubmit={(e) => {
            e.preventDefault()
            if (!running) runAgent(brief)
          }}
        >
          <textarea
            className="agent-ask__input"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Make it look like Cartoon Network…"
            rows={3}
            aria-label="Describe the look you want"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !running && agent.ready) runAgent(brief)
            }}
          />
          <div className="agent-ask__row">
            {agent.ready ? (
              <span className="agent-muted">⌘ Enter to send</span>
            ) : (
              <button type="button" className="agent-link" onClick={() => setSettingsOpen(true)}>
                <Key size={12} weight="fill" /> Connect the agent to use your own words
              </button>
            )}
            {running ? (
              <button type="button" className="ui-btn ui-btn--ghost" onClick={() => abort.current?.abort()}>
                <Stop size={12} weight="fill" /> Stop
              </button>
            ) : (
              <button type="submit" className="ui-btn ui-btn--primary" disabled={!agent.ready || !brief.trim()}>
                Style it <PaperPlaneRight size={12} weight="fill" />
              </button>
            )}
          </div>
          {!run && agent.ready ? (
            <div className="agent-chips" aria-label="Examples">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => setBrief(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          ) : null}
        </form>

        {run ? (
          <section className={`agent-run is-${run.phase}`} aria-label="Progress">
            <p className="agent-run__brief">
              {run.source === 'preset' ? 'Preset · ' : ''}“{run.brief}”
            </p>
            <Progress run={run} />
            <Timeline stages={run.stages} />
            {run.phase === 'error' ? <p className="agent-error">{run.error}</p> : null}
            {run.phase === 'done' ? (
              <div className="agent-result">
                <p className="agent-result__summary">
                  <Check size={14} weight="bold" /> {run.summary}
                </p>
                <ChangeList changes={run.changes ?? []} />
                <div className="agent-result__actions">
                  <button
                    type="button"
                    className="ui-btn ui-btn--ghost"
                    onClick={() => {
                      if (run.previous) replaceTheme(run.previous)
                      setRun(null)
                    }}
                  >
                    <ArrowCounterClockwise size={12} weight="bold" /> Undo
                  </button>
                  <button type="button" className="ui-btn ui-btn--primary" onClick={() => setRun(null)}>
                    Keep it
                  </button>
                </div>
                <p className="agent-muted">Fine-tune anything with the sliders on the left.</p>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="agent-presets" aria-labelledby="presets-title">
          <h3 id="presets-title">{agent.ready ? 'Or start from a preset' : 'Try a preset (no connection needed)'}</h3>
          <div className="agent-presets__grid">
            {THEME_PRESETS.map((p) => (
              <button key={p.id} type="button" className="agent-preset" disabled={running} onClick={() => runPreset(p)}>
                <span
                  className="agent-preset__swatch"
                  style={{
                    background: p.proposal.main ? `oklch(${p.proposal.main.l} ${p.proposal.main.c} ${p.proposal.main.h})` : undefined,
                    borderRadius: Math.min(p.proposal.radius ?? 8, 14),
                  }}
                  aria-hidden="true"
                >
                  {p.proposal.accent ? <i style={{ background: p.proposal.accent }} /> : null}
                </span>
                <strong>{p.name}</strong>
                <span>{p.blurb}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}
