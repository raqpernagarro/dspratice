import type { ComponentType } from 'react'

export type RenderProps = { props: Record<string, unknown>; onEvent: (name: string, detail?: unknown) => void }
export interface Renderer {
  name: string
  load: () => Promise<ComponentType<RenderProps>>
  defaults?: Record<string, unknown>
  heavy?: boolean
  block?: boolean
  minHeight?: number
}

export const STARTER_RENDERERS: Record<string, Renderer> = {
  'starter:button': {
    name: 'Button',
    defaults: { label: 'Primary action' },
    load: async () => {
      const { Button } = await import('@starter/components/button/Button')
      return ({ props, onEvent }) => (
        <>
          <Button variant="primary" size={(props.size as 'sm' | 'md' | 'lg') ?? 'md'} onClick={() => onEvent('click', 'primary')}>
            {String(props.label ?? 'Primary action')}
          </Button>
          <Button variant="secondary" size={(props.size as 'sm' | 'md' | 'lg') ?? 'md'}>
            Secondary
          </Button>
          <Button variant="ghost" size={(props.size as 'sm' | 'md' | 'lg') ?? 'md'}>
            Ghost
          </Button>
          <Button variant="outline" size={(props.size as 'sm' | 'md' | 'lg') ?? 'md'}>
            Outline
          </Button>
          <Button variant="primary" size={(props.size as 'sm' | 'md' | 'lg') ?? 'md'} destructive>
            Delete
          </Button>
        </>
      )
    },
  },
}
