import { useParams } from 'react-router'
import { useStore } from '@/state/store'
import { useProject } from '@/state/hooks'
import { useDoc } from '@/knowledge/useDoc'
import type { Opportunity } from '@/state/types'

export function useOpportunity(): Opportunity | undefined {
  const { id } = useParams()
  const project = useProject()
  return useStore((s) => (id ? s.projects[project.id]?.opportunities?.[id] : undefined))
}

export function useRequestText(o: Opportunity | undefined): { text: string; loading: boolean } {
  const v = o?.request?.versions.find((x) => x.version === o.request!.current)
  const { doc, loading } = useDoc(v?.docId)
  if (!doc) return { text: '', loading }
  if ('sections' in doc) return { text: doc.sections.map((s) => `${s.heading}\n${s.text}`).join('\n\n'), loading }
  return { text: doc.text, loading }
}
