// The cascades: finding → fix → pull request → checks → Figma change set → merge → channels → eval,
// plus agent proposals, trust levels, guidance and the prototype agent. Everything is scoped.

import type { SystemActions } from '../actions'
import type { Ctx } from '../ctx'
import { planBlocks, validateReferences } from '@/contract/validate'
import { activeScope, effectiveActingAs, jobKey } from '../scope'
import { after, cancelJob, runJob, uid } from '../sim'
import { slugify } from '../system-ops'
import type { BrandId, Change, Check, ComponentGuidance, FigmaChangeSet, GuidanceChange, PullRequest, Scope, SystemState, TokenChange } from '../types'

const CHECK_DEFS: Omit<Check, 'status'>[] = [
  { id: 'parity', name: 'Figma ↔ code parity', durationMs: 1400 },
  { id: 'a11y', name: 'Accessibility on every story', durationMs: 1800 },
  { id: 'grammar', name: 'Token grammar and collisions', durationMs: 900 },
  { id: 'eval', name: 'On-system eval', durationMs: 2200, gate: 90 },
  { id: 'index', name: 'Index and AI files up to date', durationMs: 700 },
]

export function computeImpact(sys: SystemState, tokenChanges: TokenChange[], componentIds: string[], guidanceChanges: GuidanceChange[]) {
  const ids = new Set(componentIds)
  let layers = 0
  for (const tc of tokenChanges) {
    const tok = sys.tokens.find((t) => t.id === tc.tokenId)
    if (!tok) continue
    layers += tok.figmaLayerCount
    tok.usedBy.forEach((c) => ids.add(c))
  }
  for (const g of guidanceChanges) ids.add(g.componentId)
  const docs = new Set<string>()
  for (const id of ids) {
    const c = sys.components.find((x) => x.id === id)
    if (c && (tokenChanges.length === 0 || c.tokenRefs.some((r) => tokenChanges.some((tc) => tc.tokenId === r)))) docs.add(`${c.name} usage`)
  }
  if (tokenChanges.length) docs.add('Colour tokens')
  return { componentIds: Array.from(ids), figmaLayers: layers, figmaFiles: layers > 0 ? 2 : 0, docsPages: Array.from(docs).slice(0, 4), channels: 6 }
}

export function applyChangeEffects(sys: SystemState, change: Change) {
  for (const tc of change.tokenChanges) {
    const tok = sys.tokens.find((t) => t.id === tc.tokenId)
    if (tok) tok.values[tc.mode] = tc.to
  }
  for (const gc of change.guidanceChanges) {
    const c = sys.components.find((x) => x.id === gc.componentId)
    if (c) {
      if (gc.field === 'antiPatterns') c.guidance.antiPatterns = gc.to.split('\n').filter(Boolean)
      else c.guidance[gc.field] = gc.to
    }
  }
  change.status = 'applied'
}

export function makeFigmaChangeSet(sys: SystemState, title: string, tokenChanges: TokenChange[], prNumber?: number): FigmaChangeSet | undefined {
  if (!tokenChanges.length) return undefined
  const rows = tokenChanges.map((tc) => {
    const tok = sys.tokens.find((t) => t.id === tc.tokenId)!
    const figmaNow = tok.figmaDrift?.[tc.mode] ?? tc.from
    return { tokenId: tc.tokenId, figmaName: tok.figmaName, mode: tc.mode, change: tc.to, figmaNow, atLastSync: tc.from, system: tc.to, status: figmaNow !== tc.from ? ('both' as const) : ('different' as const), include: true }
  })
  const cs: FigmaChangeSet = { id: uid('cs'), prNumber, title, rows, layersRebound: 0, status: 'pending', file: `${sys.theme.name} UI Kit` }
  sys.figmaChangeSets.unshift(cs)
  return cs
}

export function systemSlice(ctx: Ctx): SystemActions {
  const { setSys, readSys, log, toast, get } = ctx
  const now = ctx.now

  const runChecksImpl = (scope: Scope, prNumber: number) => {
    const pr = readSys(scope).pullRequests.find((p) => p.number === prNumber)
    if (!pr) return
    setSys(scope, (sys) => {
      const p = sys.pullRequests.find((x) => x.number === prNumber)!
      p.status = 'checks_running'
      p.checks.forEach((c) => {
        if (c.status !== 'pass') c.status = 'queued'
      })
    })
    const toRun = readSys(scope).pullRequests.find((p) => p.number === prNumber)!.checks.filter((c) => c.status !== 'pass')
    runJob(
      jobKey(scope, `checks-${prNumber}`),
      `Checks for #${prNumber}`,
      toRun.map((c) => ({
        label: c.name,
        ms: c.durationMs,
        onEnter: () =>
          setSys(scope, (sys) => {
            const chk = sys.pullRequests.find((x) => x.number === prNumber)?.checks.find((x) => x.id === c.id)
            if (chk) chk.status = 'running'
          }),
        onDone: () =>
          setSys(scope, (sys) => {
            const p = sys.pullRequests.find((x) => x.number === prNumber)
            const chk = p?.checks.find((x) => x.id === c.id)
            if (!p || !chk) return
            const cs = p.figmaChangeSetId ? sys.figmaChangeSets.find((f) => f.id === p.figmaChangeSetId) : undefined
            if (chk.id === 'parity') {
              if (cs && cs.status !== 'applied') {
                chk.status = 'fail'
                chk.detail = 'Figma still holds the old value. Apply the Figma change set, then this check re-runs.'
              } else {
                chk.status = 'pass'
                chk.detail = cs ? `${cs.layersRebound || cs.rows.length} layers rebound; Figma and code agree.` : `${sys.baseline.componentsInFigma} component sets match their code counterparts.`
              }
            } else if (chk.id === 'eval') {
              chk.status = 'pass'
              chk.score = 96
              chk.detail = '20 prompts per tool, scored against tokens, components and rules.'
            } else if (chk.id === 'a11y') {
              chk.status = 'pass'
              chk.detail = 'Every story passes axe; 0 violations.'
            } else if (chk.id === 'grammar') {
              chk.status = 'pass'
              chk.detail = 'No banned words; state ladder holds in light and dark.'
            } else {
              chk.status = 'pass'
              chk.detail = 'ds-index.json, llms.txt and DESIGN.md regenerated on this branch.'
            }
          }),
      })),
      () => {
        setSys(scope, (sys) => {
          const p = sys.pullRequests.find((x) => x.number === prNumber)
          if (!p) return
          p.status = p.checks.every((c) => c.status === 'pass') ? 'waiting_review' : 'changes_requested'
        })
        const p = readSys(scope).pullRequests.find((x) => x.number === prNumber)
        if (!p) return
        const allPass = p.checks.every((c) => c.status === 'pass')
        log(scope, allPass ? `Checks passed on #${prNumber}; waiting for review` : `Checks on #${prNumber}: parity failed until the Figma change set is applied`, { type: 'pr', id: String(prNumber) }, true, 'CI')
        toast(
          allPass
            ? { kind: 'ok', title: `All 5 checks passed on #${prNumber}`, detail: 'Local simulation · no CI run was triggered' }
            : { kind: 'warn', title: `Parity check failed on #${prNumber}`, detail: 'Apply the Figma change set in the 3-way review, then the check re-runs. Local simulation.' },
        )
      },
    )
  }

  const createPRImpl = (scope: Scope, changeId: string, openedFrom: PullRequest['openedFrom']): number | undefined => {
    let number: number | undefined
    setSys(scope, (sys) => {
      const change = sys.changes.find((c) => c.id === changeId)
      if (!change || change.status !== 'draft') return
      number = 128 + sys.pullRequests.length
      const finding = change.findingId ? sys.findings.find((f) => f.id === change.findingId) : undefined
      const cs = makeFigmaChangeSet(sys, change.title, change.tokenChanges, number)
      const pr: PullRequest = {
        number,
        title: change.title,
        branch: `ds/${slugify(change.title)}`,
        base: 'main',
        changeId,
        findingIds: finding ? [finding.id] : change.guidanceChanges.length ? sys.findings.filter((f) => f.ruleId === 'guidance-complete' && change.guidanceChanges.some((g) => f.componentIds.includes(g.componentId) && f.status !== 'merged')).map((f) => f.id) : [],
        checks: CHECK_DEFS.map((c) => ({ ...c, status: 'queued' as const })),
        reviewers: [
          { personId: 'p-owner', required: true, state: 'pending' },
          { personId: 'p-contributors', required: false, state: 'pending' },
        ],
        status: 'checks_running',
        figmaChangeSetId: cs?.id,
        createdAt: now(),
        openedFrom,
      }
      sys.pullRequests.unshift(pr)
      change.status = 'in_pr'
      change.prNumber = number
      if (finding) {
        finding.status = 'in_pr'
        finding.prNumber = number
      }
      for (const fid of pr.findingIds) {
        const f = sys.findings.find((x) => x.id === fid)
        if (f) {
          f.status = 'in_pr'
          f.prNumber = number
        }
      }
    })
    if (number !== undefined) {
      const n = number
      log(scope, `Opened pull request #${n} from the panel (branch ds/…)`, { type: 'pr', id: String(n) }, true)
      toast({ kind: 'sim', title: `Pull request #${n} created`, detail: 'Local simulation · nothing was pushed to GitHub. Checks are running.' })
      after(jobKey(scope, `start-checks-${n}`), 400, () => runChecksImpl(scope, n))
    }
    return number
  }

  const actorName = (scope: Scope, sys: SystemState) => sys.people.find((p) => p.id === effectiveActingAs(get(), scope))?.name ?? 'You'

  return {
    proposeFix: (findingId) => {
      const scope = activeScope()
      let changeId: string | undefined
      setSys(scope, (sys) => {
        const f = sys.findings.find((x) => x.id === findingId)
        if (!f || !f.suggestedFix || f.status !== 'open') return
        const tokenChanges = f.suggestedFix.tokenChanges ?? []
        const guidanceChanges = f.suggestedFix.guidanceChanges ?? []
        const change: Change = {
          id: uid('ch'),
          kind: guidanceChanges.length ? 'guidance' : tokenChanges.length ? 'token' : f.fixSide === 'figma' ? 'figma' : 'contract',
          title: f.title.replace(/looks the same as default in dark mode/i, 'hover in dark mode').replace(/^Hover looks/i, 'Button hover'),
          findingId: f.id,
          tokenChanges,
          guidanceChanges,
          impact: computeImpact(sys, tokenChanges, f.componentIds, guidanceChanges),
          status: 'draft',
          createdAt: now(),
          author: actorName(scope, sys),
        }
        if (f.id === 'f-hover-dark') change.title = 'Button hover in dark mode'
        sys.changes.unshift(change)
        f.status = 'proposed'
        f.changeId = change.id
        changeId = change.id
      })
      if (changeId) log(scope, `Proposed a fix for "${readSys(scope).findings.find((f) => f.id === findingId)?.title}"`, { type: 'change', id: changeId })
      return changeId
    },
    dismissFinding: (findingId, reason) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        const f = sys.findings.find((x) => x.id === findingId)
        if (f) {
          f.status = 'dismissed'
          f.dismissReason = reason
        }
      })
      log(scope, `Dismissed "${readSys(scope).findings.find((f) => f.id === findingId)?.title}": ${reason}`, { type: 'finding', id: findingId })
    },
    reopenFinding: (findingId) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        const f = sys.findings.find((x) => x.id === findingId)
        if (f) {
          f.status = 'open'
          delete f.dismissReason
        }
      })
      log(scope, 'Reopened a finding', { type: 'finding', id: findingId })
    },
    createPR: (changeId) => createPRImpl(activeScope(), changeId, 'panel'),
    discardChange: (changeId) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        const c = sys.changes.find((x) => x.id === changeId)
        if (!c || c.status !== 'draft') return
        c.status = 'discarded'
        const f = c.findingId ? sys.findings.find((x) => x.id === c.findingId) : undefined
        if (f && f.status === 'proposed') {
          f.status = 'open'
          delete f.changeId
        }
      })
      log(scope, 'Discarded a draft change', { type: 'change', id: changeId })
    },
    runChecks: (prNumber) => runChecksImpl(activeScope(), prNumber),
    approvePR: (prNumber) => {
      const scope = activeScope()
      setSys(scope, (sys, s) => {
        const p = sys.pullRequests.find((x) => x.number === prNumber)
        if (!p) return
        const me = effectiveActingAs(s, scope)
        const r = p.reviewers.find((x) => x.personId === me) ?? p.reviewers[0]
        r.state = 'approved'
        if (p.reviewers.filter((x) => x.required).every((x) => x.state === 'approved') && p.status === 'waiting_review') p.status = 'approved'
      })
      log(scope, `Approved #${prNumber}`, { type: 'pr', id: String(prNumber) })
    },
    mergePR: (prNumber) => {
      const scope = activeScope()
      const s0 = readSys(scope)
      const pr = s0.pullRequests.find((x) => x.number === prNumber)
      const role = s0.people.find((p) => p.id === effectiveActingAs(get(), scope))?.role
      if (!pr || role !== 'owner') return false
      if (!pr.checks.every((c) => c.status === 'pass')) return false
      setSys(scope, (sys) => {
        const p = sys.pullRequests.find((x) => x.number === prNumber)!
        p.status = 'merged'
        p.mergedAt = now()
        p.reviewers.forEach((r) => {
          if (r.required) r.state = 'approved'
        })
        const change = sys.changes.find((c) => c.id === p.changeId)
        if (change) applyChangeEffects(sys, change)
        for (const fid of p.findingIds) {
          const f = sys.findings.find((x) => x.id === fid)
          if (f) f.status = 'merged'
        }
        for (const c of sys.channels) {
          c.status = 'stale'
          c.staleReason = `#${prNumber} merged · regenerate from the contract`
        }
        sys.contract.version += 1
      })
      log(scope, `Merged #${prNumber} into main; 6 channels marked stale until the publisher runs`, { type: 'pr', id: String(prNumber) }, true)
      toast({ kind: 'ok', title: `#${prNumber} merged`, detail: 'Local simulation · token values updated in the panel; channels need publishing.', diff: ['token values updated', 'finding → merged', '6 channels → stale', 'contract version +1'] })
      return true
    },
    requestMerge: (prNumber) => {
      log(activeScope(), `Requested a merge of #${prNumber} from the design system owner`, { type: 'pr', id: String(prNumber) })
      toast({ kind: 'info', title: 'Merge requested', detail: 'Only the design system owner can merge. Switch "acting as" in the top bar to see the owner view.' })
    },
    closePR: (prNumber) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        const p = sys.pullRequests.find((x) => x.number === prNumber)
        if (!p || p.status === 'merged') return
        p.status = 'closed'
        const change = sys.changes.find((c) => c.id === p.changeId)
        if (change) change.status = 'discarded'
        for (const fid of p.findingIds) {
          const f = sys.findings.find((x) => x.id === fid)
          if (f && f.status === 'in_pr') {
            f.status = 'open'
            delete f.prNumber
            delete f.changeId
          }
        }
      })
      cancelJob(jobKey(scope, `checks-${prNumber}`))
      log(scope, `Closed #${prNumber} without merging`, { type: 'pr', id: String(prNumber) })
    },
    applyFigmaChangeSet: (id) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        const cs = sys.figmaChangeSets.find((x) => x.id === id)
        if (!cs || cs.status === 'applied') return
        cs.status = 'version_saved'
        cs.versionLabel = 'Before DS Configurator import'
      })
      toast({ kind: 'sim', title: 'Version saved in the file history', detail: '"Before DS Configurator import" · roll back in one step. Local simulation.' })
      after(jobKey(scope, `apply-${id}`), 1100, () => {
        setSys(scope, (sys) => {
          const cs = sys.figmaChangeSets.find((x) => x.id === id)
          if (!cs) return
          cs.status = 'applied'
          cs.appliedAt = now()
          let layers = 0
          for (const row of cs.rows) {
            if (!row.include) continue
            row.status = 'applied'
            row.figmaNow = row.system
            row.atLastSync = row.system
            const tok = sys.tokens.find((t) => t.id === row.tokenId)
            if (tok) {
              layers += tok.figmaLayerCount
              if (tok.figmaDrift) delete tok.figmaDrift[row.mode]
            }
          }
          cs.layersRebound = layers
        })
        const cs = readSys(scope).figmaChangeSets.find((x) => x.id === id)
        if (!cs) return
        log(scope, `Applied ${cs.rows.filter((r) => r.include).length} change(s) to "${cs.file}": ${cs.layersRebound} layers rebound`, { type: 'figma', id }, true, 'DS Configurator sync')
        toast({ kind: 'ok', title: `${cs.rows.filter((r) => r.include).length} change applied in Figma`, detail: `${cs.layersRebound} layers rebound · only layers bound to this variable changed. Local simulation.` })
        if (cs.prNumber) {
          const pr = readSys(scope).pullRequests.find((p) => p.number === cs.prNumber)
          if (pr && pr.checks.some((c) => c.id === 'parity' && c.status === 'fail')) {
            setSys(scope, (sys) => {
              const p = sys.pullRequests.find((x) => x.number === cs.prNumber)
              const parity = p?.checks.find((c) => c.id === 'parity')
              if (parity) parity.status = 'queued'
            })
            runChecksImpl(scope, cs.prNumber)
          }
        }
      })
    },
    undoFigmaChangeSet: (id) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        const cs = sys.figmaChangeSets.find((x) => x.id === id)
        if (!cs || cs.status !== 'applied') return
        cs.status = 'undone'
        for (const row of cs.rows) {
          row.figmaNow = row.atLastSync === row.system ? (row.change === row.system ? (sys.tokens.find((t) => t.id === row.tokenId)?.values[row.mode] ?? row.atLastSync) : row.atLastSync) : row.atLastSync
          row.status = 'different'
        }
        if (cs.prNumber) {
          const p = sys.pullRequests.find((x) => x.number === cs.prNumber)
          if (p && p.status !== 'merged') {
            const parity = p.checks.find((c) => c.id === 'parity')
            if (parity) {
              parity.status = 'fail'
              parity.detail = 'Figma was rolled back to the saved version.'
            }
            p.status = 'changes_requested'
          }
        }
      })
      log(scope, 'Rolled Figma back to the saved version', { type: 'figma', id }, true, 'DS Configurator sync')
    },
    reopenFigmaChangeSet: (id) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        const cs = sys.figmaChangeSets.find((x) => x.id === id)
        if (!cs || cs.status !== 'undone') return
        cs.status = 'pending'
        cs.rows.forEach((r) => {
          r.status = r.figmaNow !== r.atLastSync ? 'both' : 'different'
        })
      })
      log(scope, 'Reopened a Figma change set for review', { type: 'figma', id })
    },
    toggleFigmaRow: (id, tokenId, mode) =>
      setSys(activeScope(), (sys) => {
        const cs = sys.figmaChangeSets.find((x) => x.id === id)
        const row = cs?.rows.find((r) => r.tokenId === tokenId && r.mode === mode)
        if (row && cs?.status === 'pending') row.include = !row.include
      }),
    publishChannels: (ids) => {
      const scope = activeScope()
      const sys0 = readSys(scope)
      const targets = (ids ?? sys0.channels.map((c) => c.id)).filter((id) => sys0.channels.find((c) => c.id === id)?.status !== 'publishing')
      if (!targets.length) return
      setSys(scope, (sys) => {
        for (const c of sys.channels) if (targets.includes(c.id)) c.status = 'publishing'
      })
      runJob(
        jobKey(scope, 'publish'),
        'Publishing channels',
        targets.map((id) => ({
          label: sys0.channels.find((c) => c.id === id)!.name,
          ms: 650,
          onDone: () =>
            setSys(scope, (sys) => {
              const c = sys.channels.find((x) => x.id === id)
              if (!c) return
              c.status = 'fresh'
              c.lastPublished = now()
              delete c.staleReason
            }),
        })),
        () => {
          log(scope, `Published ${targets.length} channel${targets.length > 1 ? 's' : ''} from contract v${readSys(scope).contract.version}`, { type: 'channel', id: 'all' }, true, 'Publisher agent')
          toast({ kind: 'ok', title: `${targets.length} channel${targets.length > 1 ? 's' : ''} published`, detail: 'Local simulation · files were generated in memory, nothing was uploaded.' })
        },
      )
    },
    runReleaseEval: () => {
      const scope = activeScope()
      runJob(
        jobKey(scope, 'eval'),
        'Release eval',
        [
          { label: 'Claude Code + Storybook MCP · 20 prompts', ms: 900 },
          { label: 'Claude Design · 20 prompts', ms: 800 },
          { label: 'Figma Make · 20 prompts', ms: 900 },
          { label: 'v0 with the registry · 20 prompts', ms: 800 },
          { label: 'Score against tokens, components and rules', ms: 600 },
        ],
        () => {
          setSys(scope, (sys) => {
            const prev = sys.evals[0]
            const heroFixed = sys.findings.find((f) => f.id === 'f-hover-dark')?.status === 'merged'
            const stale = sys.channels.filter((c) => c.status === 'stale').length
            const base = Math.min(98, prev.onSystem + (heroFixed ? 2 : 0) - (stale ? 3 : 0))
            const [major, minor] = prev.version.replace('v', '').split('.').map(Number)
            sys.evals.unshift({
              id: uid('eval'),
              version: `v${major}.${minor + 1}.0`,
              onSystem: base,
              gate: 90,
              prompts: 20,
              date: now(),
              perTool: [
                { tool: 'Claude Code + Storybook MCP', model: 'Claude Sonnet 5.5', score: Math.min(99, base + 4) },
                { tool: 'Claude Design', model: 'Claude Opus 5.5', score: Math.min(99, base + 3) },
                { tool: 'Figma Make', model: 'Figma agent', score: Math.max(80, base - 3) },
                { tool: 'v0 with the registry', model: 'v0', score: stale ? Math.max(70, base - 10) : Math.max(84, base - 6) },
              ],
              failures: stale ? [{ prompt: 'A pricing table with a highlighted plan', tool: 'v0', reason: 'Registry is stale: used the old hover value', rule: 'absence' }] : [],
            })
          })
          const ev = readSys(scope).evals[0]
          log(scope, `Release eval ${ev.version}: ${ev.onSystem}% on-system (gate ${ev.gate}%)`, { type: 'channel', id: 'eval' }, true, 'CI')
          toast({ kind: ev.onSystem >= ev.gate ? 'ok' : 'warn', title: `${ev.version}: ${ev.onSystem}% on-system`, detail: 'Local simulation · scores derive from the current state (stale channels lower them).' })
        },
      )
    },
    decideProposal: (id, decision) => {
      const scope = activeScope()
      const p0 = readSys(scope).agentProposals.find((p) => p.id === id)
      if (!p0) return
      if (decision === 'reject') {
        setSys(scope, (sys) => {
          const p = sys.agentProposals.find((x) => x.id === id)!
          p.status = 'rejected'
          p.decidedAt = now()
        })
        log(scope, `Rejected agent proposal "${p0.title}"`, { type: 'proposal', id })
        return
      }
      let changeId: string | undefined
      setSys(scope, (sys) => {
        const p = sys.agentProposals.find((x) => x.id === id)!
        if (sys.trust[p.trustAction] === 'never') {
          p.status = 'blocked'
          return
        }
        p.status = 'approved'
        p.decidedAt = now()
        if (p.guidanceChanges?.length || p.tokenChanges?.length) {
          const change: Change = {
            id: uid('ch'),
            kind: p.guidanceChanges?.length ? 'guidance' : 'token',
            title: p.title,
            tokenChanges: p.tokenChanges ?? [],
            guidanceChanges: p.guidanceChanges ?? [],
            impact: computeImpact(sys, p.tokenChanges ?? [], [], p.guidanceChanges ?? []),
            status: 'draft',
            createdAt: now(),
            author: 'Patrol agent',
          }
          sys.changes.unshift(change)
          changeId = change.id
        }
      })
      log(scope, `Approved agent proposal "${p0.title}"`, { type: 'proposal', id })
      if (changeId) createPRImpl(scope, changeId, 'agent')
      else toast({ kind: 'info', title: 'Approved', detail: 'The rename is recorded in the contract adapter mapping; it ships with the next adapter release.' })
    },
    undoProposal: (id) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        const p = sys.agentProposals.find((x) => x.id === id)
        if (!p || p.status !== 'auto_applied') return
        p.status = 'undone'
        p.decidedAt = now()
        if (p.id === 'ap-loose-fills') {
          const f = sys.findings.find((x) => x.id === 'f-loose-fills')
          if (f) f.status = 'open'
        }
      })
      log(scope, 'Undid an auto-applied agent fix', { type: 'proposal', id }, true)
      toast({ kind: 'warn', title: 'Fix undone', detail: 'The 3 fills are loose again and the finding is open. Local simulation.' })
    },
    setTrustLevel: (action, level) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        sys.trust[action] = level
        for (const p of sys.agentProposals) {
          if (p.trustAction !== action) continue
          if (level === 'never' && p.status === 'pending') p.status = 'blocked'
          if (level !== 'never' && p.status === 'blocked') p.status = 'pending'
          if (level === 'autofix' && p.kind === 'mechanical' && p.status === 'pending') {
            p.status = 'auto_applied'
            p.decidedAt = now()
          }
        }
      })
      log(scope, `Trust level for "${action}" set to ${level}`, { type: 'trust', id: action })
    },
    saveGuidance: (componentId, guidance: ComponentGuidance) => {
      const scope = activeScope()
      let changeId: string | undefined
      setSys(scope, (sys) => {
        const c = sys.components.find((x) => x.id === componentId)
        if (!c) return
        const diff: GuidanceChange[] = []
        const fields: (keyof ComponentGuidance)[] = ['whenToUse', 'whenNotToUse', 'a11y']
        for (const f of fields) {
          const from = (c.guidance[f] as string | undefined) ?? ''
          const to = (guidance[f] as string | undefined) ?? ''
          if (from !== to) diff.push({ componentId, field: f, from, to })
        }
        const ap = guidance.antiPatterns.join('\n')
        if (ap !== c.guidance.antiPatterns.join('\n')) diff.push({ componentId, field: 'antiPatterns', from: c.guidance.antiPatterns.join('\n'), to: ap })
        if (!diff.length) return
        const change: Change = { id: uid('ch'), kind: 'guidance', title: `Guidance: ${c.name}`, tokenChanges: [], guidanceChanges: diff, impact: computeImpact(sys, [], [componentId], diff), status: 'draft', createdAt: now(), author: actorName(scope, sys) }
        sys.changes.unshift(change)
        changeId = change.id
      })
      if (!changeId) {
        toast({ kind: 'info', title: 'No changes to save' })
        return undefined
      }
      return createPRImpl(scope, changeId, 'editor')
    },
    generatePrototype: (prompt) => {
      const scope = activeScope()
      runJob(
        jobKey(scope, 'prototype'),
        'Prototype agent',
        [
          { label: 'Read the contract and the component index', ms: 500 },
          { label: 'Plan the screen from real components', ms: 700 },
          { label: 'Validate tokens, contrast and spacing', ms: 600 },
        ],
        () => {
          setSys(scope, (sys) => {
            const blocks = planBlocks(prompt, sys.components)
            const { refused, checks } = validateReferences(prompt, sys.tokens)
            sys.prototypes.unshift({ id: uid('proto'), prompt, blocks, checks, refused, createdAt: now() })
            if (sys.prototypes.length > 8) sys.prototypes.pop()
          })
          const p = readSys(scope).prototypes[0]
          log(scope, `Prototype built from ${p.blocks.length} real components${p.refused.length ? `; ${p.refused.length} invented token${p.refused.length > 1 ? 's' : ''} refused` : ''}`, { type: 'prototype', id: p.id }, true, 'Prototype agent')
        },
      )
    },
    setContractLead: (layer, leads) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        const l = sys.contract.layers.find((x) => x.layer === layer)
        if (l) l.leads = leads
      })
      log(scope, `Proposed a contract change: ${layer} is led by "${leads}" (goes to a pull request)`, { type: 'contract', id: layer })
      toast({ kind: 'sim', title: 'Contract change proposed', detail: 'Changes to ds.contract.json ship as a pull request. Local simulation.' })
    },
    toggleRule: (ruleId) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        sys.contract.rulesEnabled[ruleId] = !sys.contract.rulesEnabled[ruleId]
      })
      log(scope, `Rule "${ruleId}" ${readSys(scope).contract.rulesEnabled[ruleId] ? 'enabled' : 'switched off'} in the contract`, { type: 'contract', id: ruleId })
    },
    addBrand: (name, main) => {
      const scope = activeScope()
      setSys(scope, (sys) => {
        const id = slugify(name) as BrandId
        if (sys.theme.brands.some((b) => b.id === id)) return
        sys.theme.brands.push({ id, name, main, accent: sys.theme.color.accent })
      })
      log(scope, `Added brand "${name}"`, { type: 'wizard', id: 'brand' })
    },
  }
}
