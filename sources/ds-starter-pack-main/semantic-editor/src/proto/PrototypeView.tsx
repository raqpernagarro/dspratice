import { Check, CircleNotch, Code, Desktop, DeviceMobile, DeviceTablet, FloppyDisk, Key, PaperPlaneRight, Plus, Sparkle, Stop, Trash } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import type { SavedPrototype } from '../../../stories/base-ui/tokens/project-file'
import { explainError, runToolLoop } from '../agent/client'
import { APP_TYPES, appType } from '../app/appTypes'
import { useApp, useProject } from '../app/AppContext'
import { newId } from '../app/store'
import { ThemeScope } from '../context/SemanticEditorContext'
import { protoSystemPrompt, protoUserPrompt, PROTO_TOOLS } from './protoAgent'
import { ScreenRenderer } from './Renderer'
import { sanitizeTree, type UiNode } from './schema'
import { EXAMPLE_SCREENS } from './screens'

type Viewport = 'desktop' | 'tablet' | 'mobile'
const WIDTHS: Record<Viewport, number> = { desktop: 1280, tablet: 834, mobile: 390 }

interface Working {
  id: string | null
  title: string
  prompt: string
  tree: UiNode | null
}

interface Gen {
  phase: 'running' | 'done' | 'error'
  request: string
  steps: string[]
  startedAt: number
  doneAt?: number
  summary?: string
  error?: string
}

function GenProgress({ gen }: { gen: Gen }) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (gen.phase !== 'running') return
    const t = window.setInterval(() => tick((n) => n + 1), 500)
    return () => window.clearInterval(t)
  }, [gen.phase])
  const expected = 6
  const done = gen.phase === 'done' ? expected : Math.min(expected - 1, gen.steps.length)
  const pct = Math.round((done / expected) * 100)
  const elapsed = ((gen.doneAt ?? Date.now()) - gen.startedAt) / 1000
  const eta =
    gen.phase === 'done' ? `Built in ${Math.round(elapsed)} s` : gen.phase === 'error' ? 'Stopped' : gen.steps.length ? `About ${Math.max(3, Math.round((elapsed / gen.steps.length) * (expected - done)))} s left` : 'Usually 30 to 90 seconds'
  return (
    <div className="proto-gen" aria-live="polite">
      <p className="agent-run__brief">“{gen.request}”</p>
      <div className="agent-progress">
        <div className="agent-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Build progress">
          <span style={{ width: `${Math.max(pct, gen.phase === 'running' ? 4 : 0)}%` }} />
        </div>
        <div className="agent-progress__meta">
          <span>{pct}%</span>
          <span>{eta}</span>
        </div>
      </div>
      <ol className="agent-timeline">
        <li className={`agent-timeline__item is-${gen.steps.length || gen.phase !== 'running' ? 'done' : 'running'}`}>
          <span className="agent-timeline__icon">{gen.steps.length || gen.phase !== 'running' ? <Check size={11} weight="bold" /> : <CircleNotch size={12} weight="bold" className="spin" />}</span>
          <div>
            <strong>Reading your request</strong>
          </div>
        </li>
        {gen.steps.map((s, i) => {
          const running = gen.phase === 'running' && i === gen.steps.length - 1
          return (
            <li key={i} className={`agent-timeline__item is-${running ? 'running' : 'done'}`}>
              <span className="agent-timeline__icon">{running ? <CircleNotch size={12} weight="bold" className="spin" /> : <Check size={11} weight="bold" />}</span>
              <div>
                <strong>{s}</strong>
              </div>
            </li>
          )
        })}
      </ol>
      {gen.phase === 'error' ? <p className="agent-error">{gen.error}</p> : null}
      {gen.phase === 'done' && gen.summary ? (
        <p className="agent-result__summary">
          <Check size={14} weight="bold" /> {gen.summary}
        </p>
      ) : null}
    </div>
  )
}

export function PrototypeView({ initialId }: { initialId?: string } = {}) {
  const { doc, update } = useProject()
  const { agent, setSettingsOpen, notify } = useApp()
  const type = appType(doc.info.appType)
  const [working, setWorking] = useState<Working>(() => {
    const first = doc.prototypes.find((p) => p.id === initialId) ?? doc.prototypes[0]
    if (first) return { id: first.id, title: first.title, prompt: first.prompt, tree: first.tree as UiNode }
    const ex = EXAMPLE_SCREENS[doc.info.appType]
    return { id: null, title: ex.title, prompt: '', tree: ex.tree }
  })
  const [prompt, setPrompt] = useState('')
  const [tweak, setTweak] = useState('')
  const [gen, setGen] = useState<Gen | null>(null)
  const [viewport, setViewport] = useState<Viewport>(doc.info.appType === 'mobile' ? 'mobile' : 'desktop')
  const [showJson, setShowJson] = useState(false)
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])

  const save = (w: Working, silent = false) => {
    if (!w.tree) return w
    const id = w.id ?? newId()
    const item: SavedPrototype = { id, title: w.title || 'Untitled screen', prompt: w.prompt, tree: w.tree, createdAt: new Date().toISOString() }
    update((d) => ({ prototypes: [item, ...d.prototypes.filter((p) => p.id !== id)] }))
    if (!silent) notify(`Saved “${item.title}”. It travels with the project file.`)
    return { ...w, id }
  }

  const build = async (request: string, iterate: boolean) => {
    const ask = request.trim()
    if (!ask || gen?.phase === 'running') return
    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller
    setGen({ phase: 'running', request: ask, steps: [], startedAt: Date.now() })
    const productLine = `Product: “${doc.info.name}”, a ${type.name.toLowerCase()} (${type.description.toLowerCase()})${doc.info.description ? `: ${doc.info.description}` : ''}.`
    try {
      const { finish } = await runToolLoop({
        settings: agent.run,
        system: protoSystemPrompt(),
        prompt: protoUserPrompt(ask, productLine, iterate ? working.tree : null),
        tools: PROTO_TOOLS,
        finishTool: 'render_screen',
        signal: controller.signal,
        effort: 'medium',
        onToolCall: (call) => {
          if (call.name === 'report_progress' && typeof call.input.message === 'string') {
            const msg = call.input.message
            setGen((g) => g && { ...g, steps: [...g.steps, msg] })
          }
        },
      })
      const tree = finish ? sanitizeTree(finish.tree) : null
      if (!finish || !tree) throw new Error('The agent finished without a screen. Try describing it differently.')
      const next: Working = { id: iterate ? working.id : null, title: typeof finish.title === 'string' ? finish.title : 'New screen', prompt: iterate ? `${working.prompt}\n→ ${ask}` : ask, tree }
      setWorking(save(next, true))
      setGen((g) => g && { ...g, phase: 'done', doneAt: Date.now(), summary: typeof finish.summary === 'string' ? finish.summary : undefined })
      setTweak('')
    } catch (e) {
      setGen((g) => g && { ...g, phase: 'error', doneAt: Date.now(), error: explainError(e) })
    }
  }

  const running = gen?.phase === 'running'

  return (
    <div className="proto">
      <aside className="proto__rail" aria-label="Screens">
        <form
          className="proto-new"
          onSubmit={(e) => {
            e.preventDefault()
            build(prompt, false)
          }}
        >
          <h2>
            <Sparkle size={14} weight="fill" /> Describe a screen
          </h2>
          <textarea className="agent-ask__input" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={type.ideas[0]} aria-label="Describe the screen" />
          {agent.ready ? (
            <button type="submit" className="ui-btn ui-btn--primary" disabled={running || !prompt.trim()}>
              Build it <PaperPlaneRight size={12} weight="fill" />
            </button>
          ) : (
            <button type="button" className="agent-link" onClick={() => setSettingsOpen(true)}>
              <Key size={12} weight="fill" /> Connect the agent to build from a description
            </button>
          )}
          <div className="agent-chips agent-chips--stack">
            {type.ideas.map((idea) => (
              <button key={idea} type="button" onClick={() => setPrompt(idea)}>
                {idea}
              </button>
            ))}
          </div>
        </form>

        <div className="proto-list">
          <h3>Saved screens</h3>
          {doc.prototypes.length ? (
            doc.prototypes.map((p) => (
              <div key={p.id} className={`proto-list__item${working.id === p.id ? ' is-active' : ''}`}>
                <button type="button" onClick={() => setWorking({ id: p.id, title: p.title, prompt: p.prompt, tree: p.tree as UiNode })}>
                  {p.title}
                </button>
                <button
                  type="button"
                  className="ui-icon-btn"
                  aria-label={`Delete ${p.title}`}
                  onClick={() => {
                    if (!window.confirm(`Delete “${p.title}”?`)) return
                    update((d) => ({ prototypes: d.prototypes.filter((x) => x.id !== p.id) }))
                    if (working.id === p.id) setWorking((w) => ({ ...w, id: null }))
                  }}
                >
                  <Trash size={12} />
                </button>
              </div>
            ))
          ) : (
            <p className="agent-muted">Nothing saved yet. Built screens save automatically.</p>
          )}
        </div>

        <div className="proto-list">
          <h3>Start from an example</h3>
          {APP_TYPES.map((t) => (
            <div key={t.id} className="proto-list__item">
              <button type="button" onClick={() => setWorking({ id: null, title: EXAMPLE_SCREENS[t.id].title, prompt: '', tree: EXAMPLE_SCREENS[t.id].tree })}>
                <Plus size={11} weight="bold" /> {t.name}: {EXAMPLE_SCREENS[t.id].title}
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="proto__main" aria-label="Screen">
        <div className="proto__bar">
          <input className="proto__title" value={working.title} onChange={(e) => setWorking((w) => ({ ...w, title: e.target.value }))} aria-label="Screen name" />
          <div className="seg" role="group" aria-label="Viewport">
            {(
              [
                ['desktop', Desktop],
                ['tablet', DeviceTablet],
                ['mobile', DeviceMobile],
              ] as const
            ).map(([v, IconCmp]) => (
              <button key={v} type="button" aria-pressed={viewport === v} onClick={() => setViewport(v)} title={`${v[0].toUpperCase()}${v.slice(1)} · ${WIDTHS[v]}px`}>
                <IconCmp size={14} />
                <span className="sr-only">{v}</span>
              </button>
            ))}
          </div>
          <button type="button" className="ui-btn ui-btn--ghost" aria-pressed={showJson} onClick={() => setShowJson((s) => !s)}>
            <Code size={14} /> {showJson ? 'Hide' : 'Show'} structure
          </button>
          <button type="button" className="ui-btn ui-btn--primary" onClick={() => setWorking(save(working))} disabled={!working.tree}>
            <FloppyDisk size={14} weight="fill" /> Save
          </button>
        </div>

        <div className="proto__stage">
          {gen ? (
            <div className={`proto__gen-wrap${gen.phase !== 'running' ? ' is-docked' : ''}`}>
              <GenProgress gen={gen} />
              {gen.phase !== 'running' ? (
                <button type="button" className="ui-icon-btn" aria-label="Dismiss" onClick={() => setGen(null)}>
                  ×
                </button>
              ) : (
                <button type="button" className="ui-btn ui-btn--ghost" onClick={() => abort.current?.abort()}>
                  <Stop size={12} weight="fill" /> Stop
                </button>
              )}
            </div>
          ) : null}
          {showJson ? (
            <pre className="proto__json">{JSON.stringify(working.tree, null, 2)}</pre>
          ) : (
            <div className={`proto__frame${running ? ' is-busy' : ''}`} style={{ width: WIDTHS[viewport] }}>
              <ThemeScope>
                <ScreenRenderer tree={working.tree} />
              </ThemeScope>
            </div>
          )}
        </div>

        <form
          className="proto__tweak"
          onSubmit={(e) => {
            e.preventDefault()
            build(tweak, true)
          }}
        >
          <Sparkle size={14} weight="fill" />
          <input value={tweak} onChange={(e) => setTweak(e.target.value)} placeholder={agent.ready ? 'Change something: “add a filter bar”, “make the table denser”…' : 'Connect the agent to change this screen by describing it'} aria-label="Change this screen" disabled={!agent.ready || !working.tree} />
          <button type="submit" className="ui-btn ui-btn--primary" disabled={!agent.ready || running || !tweak.trim()}>
            Apply
          </button>
        </form>
      </section>
    </div>
  )
}
