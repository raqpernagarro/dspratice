import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, usePaths, useSys } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Field, Panel, Segmented } from '@/shell/ui'
import { PRODUCT_TYPES } from '@/fixtures/demo-brand/system'
import { LivePreview } from '@/features/govern/LivePreview'
import { NEW_PHASES, newStepStates } from '@/state/journeyProgress'

// The basics of a new system, recorded by hand when the DS Starter Pack cannot run here (the real
// set-up is NewSystem, /journey/new). The look, the repository, Figma and the hand-off are not
// simulated any more: they happen in the Starter Pack's own wizard. `why` says what each answer is for.
const STEPS = [
  { id: 'name', label: 'Name it', why: 'The name appears in Figma, in the code and in what AI tools read about the system.' },
  { id: 'brands', label: 'Brands', why: 'Each brand gets its own colours on top of the same components.' },
  { id: 'type', label: 'Product', why: 'Sets sensible defaults for density and touch targets.' },
  { id: 'modes', label: 'Light and dark', why: 'Decides which colour modes every component supports.' },
]

export function Wizard() {
  const { step: stepParam } = useParams()
  const navigate = useNavigate()
  const r = usePaths()
  const theme = useSys((s) => s.theme)
  const update = useStore((s) => s.updateTheme)
  const completeWizard = useStore((s) => s.completeWizard)
  const chooseEntryPath = useStore((s) => s.chooseEntryPath)

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

  return (
    <div className="page">
      <PageHead
        noTabs
        eyebrow={
          <span className="kicker">
            <span className="kicker__n">{String(step + 1).padStart(2, '0')}</span>
            <span>
              The basics of a new system · step {step + 1} of {STEPS.length}
            </span>
          </span>
        }
        title={current.label}
        lead={current.why}
      />
      <Callout tone="info">
        These are the basics only, for when the DS Starter Pack cannot run here. The look, the repository and the Figma file are set up in the Starter Pack’s own wizard. <Link to={r.journeyNew()}>Set it up in the Starter Pack</Link>
      </Callout>

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

          {blocked && <Callout tone="warn">{blocked}</Callout>}
          <div className="row row--between" style={{ borderTop: 'var(--n-hairline) solid var(--n-line)', paddingTop: 12 }}>
            <Btn variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowLeft /> Back
            </Btn>
            <span className="xs muted">Your answers save as you go.</span>
            {step < STEPS.length - 1 ? (
              <Btn onClick={continueStep} data-testid="wizard-continue">
                Continue <ArrowRight />
              </Btn>
            ) : (
              <Btn
                onClick={() => {
                  act().markJourneyStep('new', STEPS.length, true)
                  completeWizard()
                  navigate(r.home)
                }}
                data-testid="wizard-finish"
              >
                Save the basics <ArrowRight />
              </Btn>
            )}
          </div>
        </Panel>

        <div className="stack">
          <LivePreview />
        </div>
      </div>

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
