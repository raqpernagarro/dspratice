// How pages read state: the workspace comes from the route, the scope from the workspace and the
// selected project, and the system view from the scope (draft internally, session over published
// for clients). Actions are read with `act()` in event handlers so they never subscribe.

import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { useStore, type AppState } from './store'
import { familyFor, workspaceFromPath, type RouteFamily, type WorkspaceRoute } from '@/app/routes'
import { projectBySlug, resolveView } from './scope'
import type { Project, Scope, SystemState } from './types'

export function useWorkspaceRoute(): WorkspaceRoute {
  const { pathname } = useLocation()
  return useMemo(() => workspaceFromPath(pathname), [pathname])
}

export function useIsClient() {
  return useWorkspaceRoute().workspace === 'client'
}

export function useScope(): Scope {
  const route = useWorkspaceRoute()
  const selected = useStore((s) => s.selectedProjectId)
  const bySlug = useStore((s) => (route.slug ? projectBySlug(s, route.slug)?.id : undefined))
  if (route.workspace === 'client') return { projectId: bySlug ?? selected, layer: 'session' }
  return { projectId: bySlug ?? selected, layer: 'draft' }
}

export function useProject(): Project {
  const scope = useScope()
  return useStore((s) => s.projects[scope.projectId] ?? s.projects[s.selectedProjectId])
}

export function useProjectSlug() {
  return useProject().slug
}

/** The system the current page reads. Falls back to the draft when nothing is published (presenter preview). */
export function useSystem(): SystemState {
  const scope = useScope()
  return useStore((s) => resolveView(s, scope.projectId, scope.layer === 'session' ? 'session' : 'draft') ?? s.projects[scope.projectId]?.draft ?? s.projects[s.selectedProjectId].draft)
}

/** Fine-grained read with shallow comparison, for list pages. */
export function useSys<T>(selector: (sys: SystemState) => T): T {
  const scope = useScope()
  return useStore(
    useShallow((s) => selector(resolveView(s, scope.projectId, scope.layer === 'session' ? 'session' : 'draft') ?? s.projects[scope.projectId]?.draft ?? s.projects[s.selectedProjectId].draft)),
  )
}

/** The route family for the page's workspace and project. */
export function usePaths(): RouteFamily {
  const route = useWorkspaceRoute()
  const project = useProject()
  return useMemo(() => familyFor(route.workspace === 'client' ? 'client' : 'nagarro', project.slug), [route.workspace, project.slug])
}

export function useJob(name: string) {
  const scope = useScope()
  return useStore((s) => s.sim.jobs[`${scope.projectId}:${scope.layer}:${name}`])
}

export function usePresenter() {
  return useStore((s) => s.ui.presenter)
}

/** Actions without subscribing. */
export const act = (): AppState => useStore.getState()
