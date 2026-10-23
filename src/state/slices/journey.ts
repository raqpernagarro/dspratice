import type { JourneyActions } from '../actions'
import type { Ctx } from '../ctx'
import { PRESETS } from '@/fixtures/reference/presets'
import { SEED_FINDINGS } from '@/fixtures/demo-brand/findings'
import { DEMO_TOKENS, BEFORE_STATE } from '@/fixtures/demo-brand/tokens'
import { SCAN_STAGES } from '@/fixtures/demo-brand/system'
import { mapGrammar } from '@/contract/adapters'
import { DSN_SAMPLE, KIT_SAMPLE, STARTER_SAMPLE } from '@/fixtures/reference/grammars'
import { activeScope, jobKey } from '../scope'
import { cancelJob, runJob } from '../sim'
import { applyThemeIntents, fastForwardSystem, slugify } from '../system-ops'
import { makeFigmaChangeSet } from './system'
import type { ThemeConfig, TokenChange } from '../types'
import { NEW_STEPS } from '../journeyProgress'

export function journeySlice(ctx: Ctx): JourneyActions {
  const { setSys, readSys, log, toast } = ctx
  return {
    chooseEntryPath: (p) => setSys(activeScope(), (sys) => void (sys.journey.entryPath = p)),
    setJourneyProgress: (journey, patch) =>
      setSys(activeScope(), (sys) => {
        const j = sys.journey[journey]
        if (j.currentStep === patch.currentStep && Object.keys(patch).length === 1) return
        Object.assign(j, patch)
        if (patch.currentStep && !j.visited.includes(patch.currentStep)) j.visited.push(patch.currentStep)
      }),
    setJourneyData: (journey, key, value) =>
      setSys(activeScope(), (sys) => {
        sys.journey[journey].data[key] = value
      }),
    markJourneyStep: (journey, step, done = true) =>
      setSys(activeScope(), (sys) => {
        const j = sys.journey[journey]
        const list = (j.done ??= [])
        const at = list.indexOf(step)
        if (done && at < 0) list.push(step)
        if (!done && at >= 0) list.splice(at, 1)
        if (!j.startedAt) j.startedAt = ctx.now()
      }),
    updateTheme: (patch) =>
      setSys(activeScope(), (sys) => {
        Object.assign(sys.theme, patch)
        const b = sys.theme.brands.find((x) => x.id === sys.theme.activeBrand)
        if (b && patch.color?.main) b.main = patch.color.main
        if (b && patch.color?.accent) b.accent = patch.color.accent
      }),
    applyPreset: (presetId) => {
      const scope = activeScope()
      const p = PRESETS.find((x) => x.id === presetId)
      if (!p) return
      setSys(scope, (sys) => {
        sys.theme.presetId = p.id
        sys.theme.startingPoint = 'preset'
        sys.theme.color.main = p.main
        sys.theme.color.accent = p.accent
        sys.theme.type = { heading: p.heading, body: p.body, baseSize: p.baseSize, headingWeight: p.headingWeight }
        sys.theme.radius = p.radius
        sys.theme.density = p.density
        sys.theme.depth = p.depth
        sys.theme.buttonShape = p.buttonShape
        if (p.appearance) sys.theme.appearance = p.appearance
        const b = sys.theme.brands.find((x) => x.id === sys.theme.activeBrand)
        if (b) {
          b.main = p.main
          b.accent = p.accent
        }
      })
      log(scope, `Applied preset "${p.name}" (${p.origin})`, { type: 'wizard', id: p.id })
    },
    describeLook: (brief) => {
      const scope = activeScope()
      // A local, rule-based stylist (no model): maps words in the brief to theme intents.
      const b = brief.toLowerCase()
      const current = readSys(scope).theme
      const patch: Partial<ThemeConfig> = { brief, startingPoint: 'describe', presetId: undefined }
      const color = { ...current.color }
      if (/calm|trust|health|care/.test(b)) color.main = '#2a8aa8'
      else if (/bold|playful|fun/.test(b)) color.main = '#6b4ff5'
      else if (/finance|bank|serious|sharp/.test(b)) color.main = '#1f3a93'
      else if (/green|nature|eco/.test(b)) color.main = '#1f7a4d'
      else if (/warm|editorial|craft/.test(b)) color.main = '#7a3b2e'
      if (/energetic|accent|pop|neon/.test(b)) color.accent = '#ff3e9d'
      patch.color = color
      patch.radius = /round|soft|friendly|calm/.test(b) ? 14 : /sharp|precise|technical/.test(b) ? 2 : 8
      patch.density = /dense|compact|data/.test(b) ? 0.85 : /spacious|airy|calm/.test(b) ? 1.15 : 1
      patch.depth = /flat|minimal/.test(b) ? 0 : /depth|rich|glow/.test(b) ? 0.7 : 0.3
      patch.buttonShape = /pill|round|friendly/.test(b) ? 'pill' : 'default'
      patch.type = { ...current.type, headingWeight: /bold|strong|loud/.test(b) ? 700 : /light|elegant/.test(b) ? 500 : 600 }
      runJob(
        jobKey(scope, 'stylist'),
        'Styling agent',
        [
          { label: 'Understand the brief', ms: 500 },
          { label: 'Colour', ms: 450, onDone: () => setSys(scope, (sys) => void Object.assign(sys.theme, { color: patch.color })) },
          { label: 'Type', ms: 400, onDone: () => setSys(scope, (sys) => void Object.assign(sys.theme, { type: patch.type })) },
          { label: 'Shape and space', ms: 450, onDone: () => setSys(scope, (sys) => void Object.assign(sys.theme, { radius: patch.radius, density: patch.density, buttonShape: patch.buttonShape })) },
          { label: 'Depth', ms: 300, onDone: () => setSys(scope, (sys) => void Object.assign(sys.theme, { depth: patch.depth, brief, startingPoint: 'describe', presetId: undefined })) },
          { label: 'Check contrast', ms: 400 },
        ],
        () => {
          setSys(scope, (sys) => {
            const br = sys.theme.brands.find((x) => x.id === sys.theme.activeBrand)
            if (br && patch.color) {
              br.main = patch.color.main
              br.accent = patch.color.accent
            }
          })
          log(scope, `Styling agent applied a look for "${brief}" (local rule-based stylist, no model call)`, { type: 'wizard', id: 'describe' }, true, 'Styling agent')
          toast({ kind: 'sim', title: 'Look applied', detail: 'Local stylist · no model was called. Undo or keep it in the journey.' })
        },
      )
    },
    completeWizard: () => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        sys.journey.wizardDone = true
        sys.journey.new.completedAt = ctx.now()
        const demoBrand = sys.theme.brands.find((b) => b.id === 'demo')
        if (demoBrand) demoBrand.main = sys.theme.color.main
        applyThemeIntents(sys.tokens, sys.theme)
        sys.contract.name = `${sys.theme.name} design system`
        sys.contract.repo = sys.theme.repoUrl || sys.contract.repo
      })
      log(scope, 'Set-up basics recorded in the hub (nothing was written to a repository or to Figma)', { type: 'wizard', id: 'done' }, true)
    },
    recordStarterProject: (imp, from) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        Object.assign(sys.theme, imp.patch, { startingPoint: 'defaults', presetId: undefined, brief: undefined })
        const j = sys.journey.new
        j.done = NEW_STEPS.map((s) => s.n)
        j.startedAt ??= ctx.now()
        j.completedAt = ctx.now()
        j.data.recorded = { from, at: ctx.now(), version: imp.source.version, exportedAt: imp.source.exportedAt, kept: imp.kept, notKept: imp.notKept }
        sys.journey.wizardDone = true
        sys.journey.entryPath = 'new'
        applyThemeIntents(sys.tokens, sys.theme)
        sys.contract.name = `${sys.theme.name} design system`
        sys.contract.repo = sys.theme.repoUrl || sys.contract.repo
      })
      log(scope, `Recorded the DS Starter Pack set-up "${imp.patch.name}" (v${imp.source.version}) from ${from}`, { type: 'wizard', id: 'record' }, true)
      toast({ kind: 'ok', title: 'Set-up recorded', detail: `${imp.patch.name} is now this project’s system. What the hub keeps is listed on the page.` })
    },
    exportToFigma: () => {
      const scope = activeScope()
      const s0 = readSys(scope)
      const changes: TokenChange[] = []
      const idsLight = ['color-background-interactive-primary-default', 'color-background-interactive-primary-hover', 'color-background-interactive-primary-active', 'color-border-interactive-focus']
      for (const id of idsLight) {
        const t = s0.tokens.find((x) => x.id === id)
        const base = DEMO_TOKENS.find((d) => d.id === id)?.values.light ?? ''
        if (t && t.values.light !== base) changes.push({ tokenId: id, mode: 'light', from: base, to: t.values.light })
      }
      const r = s0.tokens.find((x) => x.id === 'shape-radius-control')
      if (r && r.values.light !== '8px') changes.push({ tokenId: 'shape-radius-control', mode: 'light', from: '8px', to: r.values.light })
      if (!changes.length) {
        changes.push({ tokenId: 'color-background-interactive-primary-default', mode: 'light', from: s0.tokens.find((x) => x.id === 'color-background-interactive-primary-default')!.values.light, to: s0.theme.color.main })
      }
      // Dedupe: the same export twice returns the pending change set instead of creating another.
      const existing = s0.journey.exportedChangeSetId ? s0.figmaChangeSets.find((c) => c.id === s0.journey.exportedChangeSetId) : undefined
      if (existing && existing.status === 'pending' && existing.rows.length === changes.length && existing.rows.every((row, i) => row.tokenId === changes[i].tokenId && row.system === changes[i].to)) return existing.id
      let id = ''
      setSys(scope, (sys) => {
        const cs = makeFigmaChangeSet(sys, `${sys.theme.name} · set-up journey v1`, changes)
        if (cs) {
          cs.rows.forEach((row) => {
            row.figmaNow = row.atLastSync
            row.status = 'different'
          })
          id = cs.id
          sys.journey.exportedChangeSetId = cs.id
        }
      })
      log(scope, `Exported ${changes.length} change${changes.length > 1 ? 's' : ''} as ${slugify(s0.theme.name)}.changes.json for the DS Configurator sync plugin`, { type: 'figma', id }, true)
      return id
    },
    connectSystem: (repoUrl, figmaUrl) => {
      const scope = activeScope()
      const r = repoUrl.toLowerCase()
      const f = figmaUrl.toLowerCase()
      setSys(scope, (sys) => {
        sys.journey.connect.repoUrl = repoUrl
        sys.journey.connect.figmaUrl = figmaUrl
        if (/flutter|angular|vue|swift|kotlin|\.net/.test(r)) {
          sys.journey.connect.status = 'unsupported'
          sys.journey.connect.message = 'This repository is not a React + JSON tokens project. The adapter reads tokens and rules only; components stay a service task.'
        } else if (/private|denied|no-access/.test(f)) {
          sys.journey.connect.status = 'denied'
          sys.journey.connect.message = 'Figma returned 403 for this file. Ask the file owner for view access, or continue with the repository only.'
        } else {
          sys.journey.connect.status = 'detected'
          sys.journey.connect.message = undefined
        }
      })
      log(scope, `Connected ${repoUrl || 'the sample repository'} and ${figmaUrl || 'the sample Figma file'} read-only (simulated on sample data, no network)`, { type: 'scan', id: 'connect' }, true)
    },
    runScan: () => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        sys.journey.scan = { status: 'running', stageDetails: [] }
        if (sys.journey.entryPath !== 'bring') sys.journey.entryPath = 'bring'
        if (sys.journey.connect.status === 'idle') sys.journey.connect.status = 'detected'
      })
      runJob(
        jobKey(scope, 'scan'),
        'Assessment scan',
        SCAN_STAGES.map((st) => ({ label: st.label, detail: st.detail, ms: st.ms, onDone: () => setSys(scope, (sys) => void sys.journey.scan.stageDetails.push(st.detail)) })),
        () => {
          setSys(scope, (sys) => {
            sys.journey.scan.status = 'done'
            sys.journey.scan.completedAt = ctx.now()
            for (const seed of SEED_FINDINGS) {
              if (!sys.findings.some((f) => f.id === seed.id)) sys.findings.push({ ...seed, source: 'scan' })
            }
            if (!sys.journey.before) {
              sys.journey.before = { takenAt: ctx.now(), readiness: 2, parityPct: BEFORE_STATE.parityPct, contrastFails: BEFORE_STATE.contrastFails, valuesWithoutCodeName: BEFORE_STATE.valuesWithoutCodeName, totalValues: BEFORE_STATE.totalValues, componentsDiffer: BEFORE_STATE.componentsDiffer, totalComponents: BEFORE_STATE.componentsInFigma, aiReadable: 0, driftItems: 12 }
            }
          })
          log(scope, 'Assessment scan finished: AI readiness 2/5, 62% Figma ↔ code, 8 contrast fails, 38 values without a code name', { type: 'scan', id: 'scan' }, true, 'Scanner')
          toast({ kind: 'sim', title: 'Assessment finished', detail: 'Simulated on sample data: no repository or Figma file was read.' })
        },
      )
    },
    cancelScan: () => {
      const scope = activeScope()
      cancelJob(jobKey(scope, 'scan'))
      setSys(scope, (sys) => void (sys.journey.scan.status = 'cancelled'))
    },
    setReadout: (id, choice) =>
      setSys(activeScope(), (sys) => {
        sys.journey.readout[id] = choice
        if (id === 'lead-tokens') {
          const layer = sys.contract.layers.find((l) => l.layer === 'semantic')
          if (layer) layer.leads = choice === 'figma' ? 'Figma variables export' : 'Style Dictionary JSON'
        }
        if (id === 'lead-components') {
          const layer = sys.contract.layers.find((l) => l.layer === 'componentApi')
          if (layer) layer.leads = choice === 'code' ? 'Code (React + Storybook manifest)' : 'Figma component sets'
        }
      }),
    setMappingGrammar: (g) => setSys(activeScope(), (sys) => void (sys.journey.mapping.grammar = g)),
    setMappingDecision: (source, d) => setSys(activeScope(), (sys) => void (sys.journey.mapping.decisions[source] = d)),
    applyMappingDecisions: () => {
      const scope = activeScope()
      const sys0 = readSys(scope)
      const g = sys0.journey.mapping.grammar
      const rows = mapGrammar(g, g === 'dsn' ? DSN_SAMPLE : g === 'starter' ? STARTER_SAMPLE : KIT_SAMPLE)
      const decided = Object.entries(sys0.journey.mapping.decisions)
      const accepted = decided.filter(([, d]) => d === 'accept' || d === 'alias').length
      setSys(scope, (sys) => {
        const layer = sys.contract.layers.find((l) => l.layer === 'semantic')
        if (layer) layer.readThrough = `${rows.length} names mapped through the ${sys.journey.mapping.grammar} adapter (${accepted} decided)`
        const f = sys.findings.find((x) => x.id === 'f-code-names')
        if (f && accepted >= Math.max(3, Math.floor(decided.length * 0.6)) && f.status === 'open') f.status = 'proposed'
      })
      log(scope, `Applied ${accepted} mapping decision${accepted === 1 ? '' : 's'} to the contract adapter`, { type: 'contract', id: 'mapping' })
      return accepted
    },
    toggleHandover: (id) => setSys(activeScope(), (sys) => void (sys.journey.handover[id] = !sys.journey.handover[id])),
    fastForwardEngagement: () => {
      const scope = activeScope()
      setSys(scope, (sys) => fastForwardSystem(sys, ctx.now()))
      log(scope, 'Fast-forwarded the engagement: remaining findings resolved, channels republished, release v2.0.0 evaluated', { type: 'scan', id: 'fast-forward' }, true, 'Demo')
      toast({ kind: 'sim', title: 'Engagement fast-forwarded', detail: 'Demo shortcut · every remaining finding is marked resolved so the handover numbers show the end state.' })
    },
  }
}
