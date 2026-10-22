import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, Check, Download, Loader2, Sparkles, Undo2 } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, useJob, usePaths, useScope, useSys } from '@/state/hooks'
import { resolveView } from '@/state/scope'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Field, Panel, Segmented, SimBadge, Sheet } from '@/shell/ui'
import { PRESETS } from '@/fixtures/reference/presets'
import { PRODUCT_TYPES } from '@/fixtures/demo-brand/system'
import { ThemeEditor } from '@/features/govern/ThemeEditor'
import { LivePreview } from '@/features/govern/LivePreview'
import { NEW_PHASES, newStepStates } from '@/state/journeyProgress'
import type { ThemeConfig } from '@/state/types'

// The ten steps of the Starter Pack set-up, grouped into four phases. `why` is the one line that
// says what the answer is used for.
const STEPS = [
  { id: 'name', label: 'Name it', why: 'The name appears in Figma, in the code and in what AI tools read about the system.' },
  { id: 'brands', label: 'Brands', why: 'Each brand gets its own colours on top of the same components.' },
  { id: 'type', label: 'Product', why: 'Sets sensible defaults for density and touch targets.' },
  { id: 'modes', label: 'Light and dark', why: 'Decides which colour modes every component supports.' },
  { id: 'start', label: 'Starting point', why: 'Gives you a look to refine instead of a blank page.' },
  { id: 'look', label: 'Fine-tune the look', why: 'Colour, type, corners and spacing, previewed on real components.' },
  { id: 'review', label: 'Check the second mode', why: 'Catch contrast problems before anything goes to Figma.' },
  { id: 'code', label: 'Code repository', why: 'Where the system’s code will live.' },
  { id: 'design', label: 'Figma file', why: 'The Figma library the variables are sent to.' },
  { id: 'figma', label: 'Send to Figma', why: 'A change file for the Figma variables plugin, reviewed before anything is applied.' },
]

export function Wizard() {
  const { step: stepParam } = useParams()
  const navigate = useNavigate()
  const r = usePaths()
  const scope = useScope()
  const theme = useSys((s) => s.theme)
  const update = useStore((s) => s.updateTheme)
  const applyPreset = useStore((s) => s.applyPreset)
  const describeLook = useStore((s) => s.describeLook)
  const completeWizard = useStore((s) => s.completeWizard)
  const exportToFigma = useStore((s) => s.exportToFigma)
  const stylist = useJob('stylist')
  const exported = useSys((s) => s.journey.exportedChangeSetId)
  const changeSets = useSys((s) => s.figmaChangeSets)
  const chooseEntryPath = useStore((s) => s.chooseEntryPath)
  const [mirrorSheet, setMirrorSheet] = useState(false)
  const [snapshot, setSnapshot] = useState<ThemeConfig | null>(null)
  const [downloaded, setDownloaded] = useState(false)

  const step = Math.max(0, Math.min(STEPS.length - 1, stepParam ? Number(stepParam) - 1 : 0))
  const go = (n: number) => navigate(r.journeyNew(Math.max(1, Math.min(STEPS.length, n + 1))))
  const sysStates = useSys((s) => newStepStates(s).join(','))
  const states = sysStates.split(',')
  const [blocked, setBlocked] = useState<string | null>(null)
  // What a step needs before Continue can mark it done.
  const missing = (): string | null => {
    if (STEPS[step].id === 'name' && !theme.name.trim()) return 'Give the system a name first.'
    if (STEPS[step].id === 'brands' && theme.brands.length === 0) return 'Add at least one brand first.'
    if (STEPS[step].id === 'type' && !theme.productType) return 'Choose the kind of product first.'
    return null
  }
  const continueStep = () => {
    const m = missing()
    if (m) return setBlocked(m)
    setBlocked(null)
    act().markJourneyStep('new', step + 1, true)
    go(step + 1)
  }

  useEffect(() => {
    chooseEntryPath('new')
    act().setJourneyProgress('new', { currentStep: step + 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const current = STEPS[step]
  const exportedSet = changeSets.find((c) => c.id === exported)

  const downloadChanges = () => {
    const id = exportToFigma()
    const cs = resolveView(useStore.getState(), scope.projectId, scope.layer)?.figmaChangeSets.find((c) => c.id === id)
    const payload = {
      format: 'ds-configurator/changes@1',
      createdAt: new Date().toISOString(),
      source: { app: 'unified-ds-tool', system: theme.name },
      modes: theme.appearance === 'both' ? ['light', 'dark'] : [theme.appearance],
      brands: theme.brands.map((b) => ({ id: b.id, name: b.name })),
      values: (cs?.rows ?? []).map((r) => ({ collection: 'semantic', variable: r.figmaName, mode: r.mode, value: r.system, reason: 'set-up wizard' })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.changes.json`
    a.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  const slug = useMemo(() => theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), [theme.name])

  return (
    <div className="page">
      <PageHead
        noTabs
        eyebrow={
          <span className="kicker">
            <span className="kicker__n">{String(step + 1).padStart(2, '0')}</span>
            <span>
              Start a new design system · step {step + 1} of {STEPS.length}
            </span>
          </span>
        }
        title={current.label}
        lead={current.why}
      />

      <div className="wizard">
        <nav className="wizard__steps steps" aria-label="Set-up steps">
          {NEW_PHASES.map((ph) => (
            <div key={ph.label} className="wizard__phase">
              <span className="wizard__phase-label">{ph.label}</span>
              {ph.steps.map((n) => {
                const i = n - 1
                const s = STEPS[i]
                const isDone = states[i] === 'done'
                return (
                  <button key={s.id} className={`step ${isDone ? 'is-done' : ''} ${i === step ? 'is-active' : ''}`} onClick={() => go(i)} aria-current={i === step ? 'step' : undefined} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
                    <span className="step__dot">{isDone ? <Check style={{ width: 12 }} /> : n}</span>
                    <span className="step__body">
                      <span className="step__title">{s.label}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <Panel>
          {current.id === 'name' && (
            <div className="stack">
              <h3>Name it</h3>
              <Field label="System name" id="w-name">
                <input id="w-name" className="input" value={theme.name} onChange={(e) => update({ name: e.target.value })} />
              </Field>
              <Field label="In one line, who is it for?" id="w-tag" hint="Optional. AI tools read it as context.">
                <input id="w-tag" className="input" value={theme.tagline} onChange={(e) => update({ tagline: e.target.value })} />
              </Field>
            </div>
          )}

          {current.id === 'brands' && (
            <div className="stack">
              <h3>One brand or several?</h3>
              <p className="muted small">Several brands differ by colours, fonts or shape. Each becomes a Figma collection that extends the semantic one.</p>
              <div className="stack">
                {theme.brands.map((b) => (
                  <div key={b.id} className="row row--between" style={{ padding: '8px 0', borderBottom: 'var(--n-hairline) solid var(--n-line)' }}>
                    <span className="row">
                      <span className="swatch" style={{ background: b.main }} /> {b.name} {b.isDefault && <Chip tone="outline">default</Chip>}
                    </span>
                    <span className="xs muted">{b.main}</span>
                  </div>
                ))}
              </div>
              <AddBrand />
            </div>
          )}

          {current.id === 'type' && (
            <div className="stack">
              <h3>What kind of product?</h3>
              <div className="grid grid--2">
                {PRODUCT_TYPES.map((t) => (
                  <button key={t.id} className={`choice ${theme.productType === t.id ? 'is-selected' : ''}`} onClick={() => update({ productType: t.id })}>
                    <div className="choice__body">
                      <span className="choice__title">{t.label}</span>
                      <span className="choice__desc">{t.blurb}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {current.id === 'modes' && (
            <div className="stack">
              <h3>Light and dark?</h3>
              <Segmented
                value={theme.appearance}
                options={[
                  { id: 'both', label: 'Light and dark' },
                  { id: 'light', label: 'Light only' },
                  { id: 'dark', label: 'Dark only' },
                ]}
                onChange={(v) => update({ appearance: v })}
              />
              {theme.appearance === 'both' && (
                <>
                  <Field label="Which one is designed first?">
                    <Segmented
                      value={theme.designedFirst}
                      options={[
                        { id: 'light', label: 'Light' },
                        { id: 'dark', label: 'Dark' },
                      ]}
                      onChange={(v) => update({ designedFirst: v })}
                    />
                  </Field>
                  <Field label="The second mode">
                    <Segmented
                      value={theme.secondMode}
                      options={[
                        { id: 'follows', label: 'Follows automatically' },
                        { id: 'separate', label: 'Set up on its own' },
                      ]}
                      onChange={(v) => update({ secondMode: v })}
                    />
                  </Field>
                </>
              )}
            </div>
          )}

          {current.id === 'start' && (
            <div className="stack">
              <h3>How do you want to start?</h3>
              <p className="muted small">Pick what feels easiest. You fine-tune it on the next step.</p>
              <button className={`choice ${theme.startingPoint === 'defaults' ? 'is-selected' : ''}`} onClick={() => update({ startingPoint: 'defaults', presetId: undefined })}>
                <div className="choice__body">
                  <span className="choice__title">A neutral, accessible base</span>
                  <span className="choice__desc">The starter as it is. Change the brand colour on the next step.</span>
                </div>
              </button>
              <div className={`choice ${theme.startingPoint === 'describe' ? 'is-selected' : ''}`} style={{ cursor: 'default' }}>
                <div className="choice__body">
                  <span className="choice__title">
                    Describe the look <SimBadge what="Rule-based" detail="Here a set of rules turns words into colours, corners and spacing. In the Starter Pack an AI agent does this, with the same Undo and Keep." />
                  </span>
                  <span className="choice__desc">Describe it in a few words, for example “calm and trustworthy” or “bold, playful, pill buttons”.</span>
                  <DescribeForm
                    running={stylist?.status === 'running'}
                    stage={stylist?.status === 'running' ? stylist.stages[stylist.stageIndex]?.label : undefined}
                    onRun={(brief) => {
                      setSnapshot(structuredClone(theme))
                      describeLook(brief)
                    }}
                    onUndo={
                      snapshot
                        ? () => {
                            update({ ...snapshot })
                            setSnapshot(null)
                          }
                        : undefined
                    }
                    onKeep={snapshot ? () => setSnapshot(null) : undefined}
                  />
                </div>
              </div>
              <div className={`choice ${theme.startingPoint === 'preset' ? 'is-selected' : ''}`} style={{ cursor: 'default' }}>
                <div className="choice__body">
                  <span className="choice__title">Pick a preset</span>
                  <span className="choice__desc">Nine ready-made looks from the practice’s two systems.</span>
                  <div className="grid grid--3" style={{ marginTop: 8 }}>
                    {PRESETS.map((p) => (
                      <button key={p.id} className={`choice ${theme.presetId === p.id ? 'is-selected' : ''}`} onClick={() => applyPreset(p.id)} style={{ padding: 12 }}>
                        <span className="swatch" style={{ background: `linear-gradient(135deg, ${p.main}, ${p.accent})` }} />
                        <div className="choice__body">
                          <span className="choice__title" style={{ fontSize: 13 }}>
                            {p.name}
                          </span>
                          <span className="choice__desc" style={{ fontSize: 12 }}>
                            {p.blurb} <span className="xs muted">· {p.origin}</span>
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button className="choice is-disabled" onClick={() => setMirrorSheet(true)}>
                <div className="choice__body">
                  <span className="choice__title">
                    Match an existing Figma file <Chip tone="dashed">Not available yet</Chip>
                  </span>
                  <span className="choice__desc">If the client already has a Figma library, use “Improve an existing system” instead.</span>
                </div>
              </button>
            </div>
          )}

          {current.id === 'look' && (
            <div className="stack">
              <h3>Fine-tune the look</h3>
              <ThemeEditor />
            </div>
          )}

          {current.id === 'review' && (
            <div className="stack">
              <h3>Check the second mode</h3>
              <p className="muted small">
                {theme.appearance === 'both'
                  ? `${theme.designedFirst === 'light' ? 'Dark' : 'Light'} mode ${theme.secondMode === 'follows' ? 'follows the first mode automatically' : 'is set up on its own'}. Preview it on the right and adjust if anything fails contrast.`
                  : 'Single mode: nothing to check here.'}
              </p>
              <Callout tone="info">Check the text in the preview: it needs a contrast of at least 4.5 : 1 against its background. In a real set-up, the Starter Pack checks contrast on every pull request.</Callout>
            </div>
          )}

          {current.id === 'code' && (
            <div className="stack">
              <h3>Where does the code live?</h3>
              <Field label="GitHub repository" id="w-repo" hint="Usually created from the Starter Pack template. Optional now; you can add it later.">
                <input id="w-repo" className="input" value={theme.repoUrl} onChange={(e) => update({ repoUrl: e.target.value })} />
              </Field>
              <Callout tone="info">
                The repository is not contacted from here. In a real set-up, the Starter Pack saves these choices to a settings file in the repository.
              </Callout>
            </div>
          )}

          {current.id === 'design' && (
            <div className="stack">
              <h3>Which Figma file?</h3>
              <Field label="Figma file" id="w-figma" hint="A copy of the starter Figma library, with the variables sync plugin installed.">
                <input id="w-figma" className="input" value={theme.figmaUrl} onChange={(e) => update({ figmaUrl: e.target.value })} />
              </Field>
            </div>
          )}

          {current.id === 'figma' && (
            <div className="stack">
              <h3>Send to Figma</h3>
              <p className="muted small">
                Download <code>{slug}.changes.json</code> and open it with the variables sync plugin in Figma. The plugin saves a version of the file first, then shows every change for review. You can also review the changes here without Figma.
              </p>
              <div className="row">
                <Btn variant="secondary" onClick={downloadChanges}>
                  <Download /> Download {slug}.changes.json
                </Btn>
                <Btn
                  variant="ghost"
                  onClick={() => {
                    const id = exportToFigma()
                    setDownloaded(true)
                    navigate(r.figma(id))
                  }}
                >
                  Review without downloading <ArrowRight />
                </Btn>
                <SimBadge what="Real file · simulated import" detail="The file downloads for real, in the plugin’s format. Importing it into Figma is simulated here." />
              </div>
              {exportedSet && (
                <Callout tone="ok">
                  {exportedSet.rows.length} change{exportedSet.rows.length > 1 ? 's' : ''} ready for review ·{' '}
                  <button className="btn btn--sm" onClick={() => navigate(r.figma(exportedSet.id))}>
                    Review the changes <ArrowRight />
                  </button>
                </Callout>
              )}
              <Btn
                disabled={!downloaded && !exportedSet}
                onClick={() => {
                  completeWizard()
                  act().markJourneyStep('new', STEPS.length, true)
                  navigate(r.home)
                }}
                title={!downloaded && !exportedSet ? 'Download or review the changes first' : undefined}
              >
                Finish the set-up <ArrowRight />
              </Btn>
            </div>
          )}

          {blocked && <Callout tone="warn">{blocked}</Callout>}
          <div className="row row--between" style={{ borderTop: 'var(--n-hairline) solid var(--n-line)', paddingTop: 12 }}>
            <Btn variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowLeft /> Back
            </Btn>
            <span className="xs muted">Your answers save as you go.</span>
            {step < STEPS.length - 1 && (
              <Btn onClick={continueStep} data-testid="wizard-continue">
                Continue <ArrowRight />
              </Btn>
            )}
          </div>
        </Panel>

        <div className="stack">
          <LivePreview />
        </div>
      </div>

      {mirrorSheet && (
        <Sheet title="Match an existing Figma file" onClose={() => setMirrorSheet(false)}>
          <p className="small">
            Setting a new system up to match an existing Figma library is planned in the Starter Pack but not available yet. If the client already has a library, use <strong>Improve an existing system</strong>: connect it read-only, assess it, and agree a plan with a specialist.
          </p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setMirrorSheet(false)}>
              Close
            </Btn>
            <Btn onClick={() => navigate(r.journeyImprove('goals'))}>
              Improve an existing system instead <ArrowRight />
            </Btn>
          </div>
        </Sheet>
      )}
    </div>
  )
}

function DescribeForm({ onRun, running, stage, onUndo, onKeep }: { onRun: (b: string) => void; running: boolean; stage?: string; onUndo?: () => void; onKeep?: () => void }) {
  const initialBrief = useSys((s) => s.theme.brief ?? '')
  const [brief, setBrief] = useState(initialBrief)
  return (
    <div className="stack" style={{ marginTop: 8 }}>
      <div className="row">
        <input className="input" placeholder="calm and trustworthy, rounded, spacious" value={brief} onChange={(e) => setBrief(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <Btn onClick={() => brief.trim() && onRun(brief.trim())} disabled={running || !brief.trim()}>
          {running ? <Loader2 className="spin" /> : <Sparkles />} {running ? stage ?? 'Styling…' : 'Style it'}
        </Btn>
      </div>
      {(onUndo || onKeep) && !running && (
        <div className="row">
          <Btn variant="secondary" size="sm" onClick={onUndo}>
            <Undo2 /> Undo
          </Btn>
          <Btn variant="mint" size="sm" onClick={onKeep}>
            <Check /> Keep it
          </Btn>
        </div>
      )}
    </div>
  )
}

function AddBrand() {
  const addBrand = useStore((s) => s.addBrand)
  const [name, setName] = useState('')
  const [main, setMain] = useState('#c3921a')
  return (
    <div className="row">
      <input className="input" placeholder="Brand name" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1, minWidth: 140 }} />
      <input type="color" value={main} onChange={(e) => setMain(e.target.value)} aria-label="Brand colour" style={{ width: 40, height: 36, border: 'none', background: 'none' }} />
      <Btn
        variant="secondary"
        onClick={() => {
          if (name.trim()) {
            addBrand(name.trim(), main)
            setName('')
          }
        }}
      >
        Add a brand
      </Btn>
    </div>
  )
}
