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
import type { ThemeConfig } from '@/state/types'

const STEPS = [
  { id: 'name', label: 'Name it' },
  { id: 'brands', label: 'Brands' },
  { id: 'type', label: 'Product' },
  { id: 'modes', label: 'Modes' },
  { id: 'start', label: 'Starting point' },
  { id: 'look', label: 'Look' },
  { id: 'review', label: 'Second mode' },
  { id: 'code', label: 'Repository' },
  { id: 'design', label: 'Figma file' },
  { id: 'figma', label: 'Export to Figma' },
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
        screen="wizard"
        title="DS Configurator · Set up system"
        lead={`Step ${step + 1} of ${STEPS.length} · ${current.label}. The ten steps of the Starter Pack wizard, with the look step shared with Brands and modes.`}
        actions={<Chip tone="outline">Saves to ds.project.json (local)</Chip>}
      />

      <div className="wizard">
        <div className="wizard__steps steps">
          {STEPS.map((s, i) => (
            <button key={s.id} className={`step ${i < step ? 'is-done' : i === step ? 'is-active' : ''}`} onClick={() => go(i)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
              <span className="step__dot">{i < step ? <Check style={{ width: 12 }} /> : i + 1}</span>
              <span className="step__body">
                <span className="step__title">{s.label}</span>
              </span>
            </button>
          ))}
        </div>

        <Panel>
          {current.id === 'name' && (
            <div className="stack">
              <h3>Name it</h3>
              <Field label="System name" id="w-name">
                <input id="w-name" className="input" value={theme.name} onChange={(e) => update({ name: e.target.value })} />
              </Field>
              <Field label="In one line, who is it for?" id="w-tag" hint="Optional. Agents read this as context.">
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
                    Describe the look <SimBadge what="Local stylist" detail="A rule-based stylist maps words to intents. In the Starter Pack this is a Claude agent with Undo / Keep." />
                  </span>
                  <span className="choice__desc">Tell the agent, e.g. “calm and trustworthy” or “bold, playful, pill buttons”.</span>
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
                  <span className="choice__desc">Five Starter Pack looks plus four from DSN’s brand configurator, in one list.</span>
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
                    Mirror an existing Figma system <Chip tone="dashed">Coming later</Chip>
                  </span>
                  <span className="choice__desc">Drop in a Figma file; Claude matches it through the Figma MCP. Today this is the “Bring your system” path with a specialist.</span>
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
              <Callout tone="ok">Contrast: all text pairs ≥ 4.5 : 1 in the preview components. The Starter Pack runs 1,488 such checks on every pull request.</Callout>
            </div>
          )}

          {current.id === 'code' && (
            <div className="stack">
              <h3>Where does the code live?</h3>
              <Field label="GitHub repository" id="w-repo" hint="Created from the template with “Use this template”. The panel installs as a dev dependency in this repository.">
                <input id="w-repo" className="input" value={theme.repoUrl} onChange={(e) => update({ repoUrl: e.target.value })} />
              </Field>
              <Callout tone="info">
                Local demo: the repository is not contacted. In the Starter Pack, the dev server writes ds.project.json to the repository root.
              </Callout>
            </div>
          )}

          {current.id === 'design' && (
            <div className="stack">
              <h3>Which Figma file?</h3>
              <Field label="Figma file" id="w-figma" hint="A copy of the starter library, with the DS Configurator sync plugin installed.">
                <input id="w-figma" className="input" value={theme.figmaUrl} onChange={(e) => update({ figmaUrl: e.target.value })} />
              </Field>
            </div>
          )}

          {current.id === 'figma' && (
            <div className="stack">
              <h3>Export to Figma</h3>
              <p className="muted small">
                Download <code>{slug}.changes.json</code> and import it with the DS Configurator sync plugin. The plugin saves a version of the file first, then shows the three-way review. Here the review opens in the panel.
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
                <SimBadge what="Real download · simulated import" detail="The file downloads for real (the plugin's format). Importing it into Figma is reproduced locally." />
              </div>
              {exportedSet && (
                <Callout tone="ok">
                  {exportedSet.rows.length} change{exportedSet.rows.length > 1 ? 's' : ''} ready for review ·{' '}
                  <button className="btn btn--sm" onClick={() => navigate(r.figma(exportedSet.id))}>
                    Open the 3-way review <ArrowRight />
                  </button>
                </Callout>
              )}
              <Btn
                disabled={!downloaded && !exportedSet}
                onClick={() => {
                  completeWizard()
                  navigate(r.home)
                }}
                title={!downloaded && !exportedSet ? 'Download the changes file first' : undefined}
              >
                Save v1 and open the panel <ArrowRight />
              </Btn>
            </div>
          )}

          <div className="row row--between" style={{ borderTop: 'var(--n-hairline) solid var(--n-line)', paddingTop: 12 }}>
            <Btn variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowLeft /> Back
            </Btn>
            {step < STEPS.length - 1 && (
              <Btn onClick={() => go(step + 1)}>
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
        <Sheet title="Mirror an existing Figma system" onClose={() => setMirrorSheet(false)}>
          <p className="small">
            The Starter Pack marks this as <strong>Coming later</strong>: drop in a Figma file and Claude sets the system up to match it, through the Figma MCP. No project in the practice reads an arbitrary client system today. The honest path is <strong>Bring your system</strong>: connect read-only, scan, agree the readout with a specialist, adapt to the contract.
          </p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setMirrorSheet(false)}>
              Close
            </Btn>
            <Btn onClick={() => navigate(r.journeyImprove(2))}>
              Bring your system instead <ArrowRight />
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
