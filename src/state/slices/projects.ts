import type { ProjectActions } from '../actions'
import { ensureSession, type Ctx } from '../ctx'
import { PROJECT_SEEDS } from '@/fixtures/projects'
import { client } from '@/app/routes'
import { cloneSys, newGuideState } from '../scope'
import { seedProject, seedState } from '../seed'
import { cancelAllJobs, cancelJobsWithPrefix, uid } from '../sim'
import { cancelAllTasks, cancelTasksWithPrefix } from '../tasks'
import { clearStoredDocs, deleteDocsWithPrefix } from '@/knowledge/docStore'
import { slugify } from '../system-ops'
import type { HistoryEvent } from '../types'

const VERSIONS_CAP = 3

export function projectsSlice(ctx: Ctx): ProjectActions {
  const { set, get, toast } = ctx
  const activity = (projectId: string, text: string, actor = 'You', entity: HistoryEvent['entity'] = { type: 'project', id: projectId }) =>
    set((s) => {
      const p = s.projects[projectId]
      if (!p) return
      p.activity.unshift({ id: uid('h'), ts: ctx.now(), actor, text, entity })
      if (p.activity.length > 50) p.activity.pop()
    })

  return {
    selectProject: (projectId) =>
      set((s) => {
        if (s.projects[projectId]) s.selectedProjectId = projectId
      }),
    publishProject: (projectId, note = '') => {
      const p0 = get().projects[projectId]
      if (!p0) return 0
      const version = (p0.published?.version ?? 0) + 1
      const snapshot = cloneSys(p0.draft)
      const by = p0.draft.people.find((x) => x.id === get().ui.actingAs)?.name ?? 'Nagarro'
      set((s) => {
        const p = s.projects[projectId]
        if (p.published) {
          p.versions.unshift(p.published)
          if (p.versions.length > VERSIONS_CAP) p.versions.length = VERSIONS_CAP
        }
        p.published = { version, publishedAt: ctx.now(), publishedBy: by, note: note || `Published v${version}`, draftRev: p.draftRev, state: snapshot }
      })
      activity(projectId, `Published v${version}${note ? ` · ${note}` : ''}`, by)
      toast({ kind: 'ok', title: `Published v${version}`, detail: 'The client experience now shows this version. A running demo session keeps its own state until it is reset.' })
      return version
    },
    rollbackTo: (projectId, version) => {
      const p0 = get().projects[projectId]
      const target = p0?.versions.find((v) => v.version === version) ?? (p0?.published?.version === version ? p0.published : undefined)
      if (!p0 || !target) return
      const next = (p0.published?.version ?? 0) + 1
      const snapshot = cloneSys(target.state)
      set((s) => {
        const p = s.projects[projectId]
        if (p.published) {
          p.versions.unshift(p.published)
          if (p.versions.length > VERSIONS_CAP) p.versions.length = VERSIONS_CAP
        }
        p.published = { version: next, publishedAt: ctx.now(), publishedBy: 'Rollback', note: `Rolled back to v${version}`, draftRev: -1, state: snapshot }
      })
      activity(projectId, `Rolled the client experience back to v${version} (published as v${next})`)
    },
    restoreDraftFromPublished: (projectId) => {
      const p0 = get().projects[projectId]
      if (!p0?.published) return
      const snapshot = cloneSys(p0.published.state)
      set((s) => {
        const p = s.projects[projectId]
        p.draft = snapshot
      })
      // The subscriber bumps draftRev; align it with the published one so the pill clears.
      set((s) => {
        const p = s.projects[projectId]
        if (p.published) p.published.draftRev = p.draftRev
      })
      activity(projectId, 'Discarded draft changes; the draft matches the published version again')
    },
    startDemoSession: (projectId, mode) => {
      const p0 = get().projects[projectId]
      if (!p0?.published) return false
      set((s) => {
        const sess = ensureSession(s, projectId, ctx.now())
        if (sess && mode) sess.guide.mode = mode
      })
      return true
    },
    resetDemoSession: (projectId) => {
      cancelJobsWithPrefix(`${projectId}:session:`)
      const p0 = get().projects[projectId]
      if (!p0) return
      const base = cloneSys(p0.published?.state ?? p0.draft)
      set((s) => {
        const p = s.projects[projectId]
        const mode = p.session?.guide.mode ?? (p.clientExperience.guidanceDefault === 'full' ? 'full' : 'meeting')
        const meetingChapters = p.session?.guide.meetingChapters ?? []
        p.session = { baseVersion: p.published?.version ?? 0, startedAt: ctx.now(), state: base, guide: { ...newGuideState(mode), meetingChapters } }
      })
      activity(projectId, 'Reset the demo session to the published version', 'Presenter', { type: 'session', id: projectId })
      toast({ kind: 'info', title: 'Demo session reset', detail: 'The client experience is back at the published version. Internal draft changes are untouched.' })
    },
    endDemoSession: (projectId) => {
      cancelJobsWithPrefix(`${projectId}:session:`)
      set((s) => {
        const p = s.projects[projectId]
        if (p) p.session = null
      })
    },
    openClientExperience: (projectId) => {
      const p0 = get().projects[projectId]
      if (!p0?.published) return null
      set((s) => {
        s.selectedProjectId = projectId
        s.ui.presenter = true
        s.ui.lastWorkspace = 'client'
        ensureSession(s, projectId, ctx.now())
      })
      return client(p0.slug).home
    },
    exitPresenter: () =>
      set((s) => {
        s.ui.presenter = false
      }),
    setClientExperience: (projectId, patch) =>
      set((s) => {
        const p = s.projects[projectId]
        if (p) Object.assign(p.clientExperience, patch)
      }),
    setClientChapter: (projectId, chapterId, enabled) =>
      set((s) => {
        const p = s.projects[projectId]
        if (p) p.clientExperience.chapters[chapterId] = enabled
      }),
    updateEngagement: (projectId, patch) =>
      set((s) => {
        const p = s.projects[projectId]
        if (p) Object.assign(p.engagement, patch)
      }),
    resetProject: (projectId) => {
      cancelJobsWithPrefix(`${projectId}:`)
      cancelTasksWithPrefix(`${projectId}:`)
      const seed = PROJECT_SEEDS.find((p) => p.id === projectId)
      if (!seed) return
      const fresh = seedProject(seed, ctx.now())
      set((s) => {
        s.projects[projectId] = fresh
        // this client's own sources go with it; practice sources and approvals are untouched
        const k = s.practice.knowledge
        for (const [id, src] of Object.entries(k.custom)) if (src.scope.kind === 'client' && src.scope.projectId === projectId) delete k.custom[id]
      })
      void deleteDocsWithPrefix(`doc.${projectId}.`).catch(() => 0)
      toast({ kind: 'info', title: `${fresh.client.name} reset`, detail: 'Draft, published version, demo session, opportunities and this client\'s own sources were reseeded from the fixtures.' })
    },
    resetAll: () => {
      cancelAllJobs()
      cancelAllTasks()
      const fresh = seedState(ctx.now())
      set((s) => {
        const keep = { lastWorkspace: s.ui.lastWorkspace }
        Object.assign(s, fresh)
        s.ui.lastWorkspace = keep.lastWorkspace
      })
      void clearStoredDocs().catch(() => undefined)
      toast({ kind: 'info', title: 'Everything reset', detail: 'Every project, prospect, opportunity, deck, uploaded source and library edit made in this browser is gone.' })
    },
    createProspect: ({ name, sector, owner }) => {
      const base = slugify(name) || 'client'
      let slug = base
      for (let i = 2; get().projects[slug] || Object.values(get().projects).some((p) => p.slug === slug); i++) slug = `${base}-${i}`
      const fresh = seedProject(
        {
          id: slug,
          slug,
          client: { name: name.trim(), sector: sector.trim(), fictional: false },
          engagement: { package: '2-week AI audit', stage: 'scoping', startedAt: ctx.now(), nextReview: 'Not set', owner: owner ?? ctx.actorName(), adapterVersion: '—', notes: '' },
          theme: { name: name.trim() },
          componentIds: [],
          findingIds: [],
          publish: false,
          clientExperience: { enabled: false, chapters: {}, guidanceDefault: 'meeting' },
        },
        ctx.now(),
      )
      fresh.opportunities = {}
      set((s) => {
        s.projects[slug] = fresh
        s.selectedProjectId = slug
      })
      activity(slug, `Created ${name.trim()} as a client or prospect`)
      return slug
    },
  }
}
