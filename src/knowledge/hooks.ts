import { useMemo } from 'react'
import { useStore } from '@/state/store'
import { knowledgeRegistry, visibleSources } from './selectors'
import type { KnowledgeSource } from './types'

export function useRegistry(): KnowledgeSource[] {
  const k = useStore((s) => s.practice.knowledge)
  return useMemo(() => knowledgeRegistry(k), [k])
}

export function useVisibleSources(projectId: string): KnowledgeSource[] {
  const reg = useRegistry()
  return useMemo(() => visibleSources(reg, projectId), [reg, projectId])
}

export function useSource(id: string | undefined): KnowledgeSource | undefined {
  const reg = useRegistry()
  return useMemo(() => reg.find((s) => s.id === id), [reg, id])
}
