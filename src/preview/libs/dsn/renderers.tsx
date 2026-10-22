// Which DSN component renders for a registry id, with sample props. Every renderer imports its own
// folder so the frame only loads what it shows; heavy ones carry their vendor chunk.

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

export const DSN_RENDERERS: Record<string, Renderer> = {
  'dsn:button': {
    name: 'Button',
    defaults: { label: 'Primary action' },
    load: async () => {
      const { Button } = await import('@dsn/components/atoms/Button')
      return ({ props, onEvent }) => (
        <>
          <Button variant="primary" size={(props.size as 'sm' | 'md') ?? 'md'} onClick={() => onEvent('click', 'primary')}>
            {String(props.label ?? 'Primary action')}
          </Button>
          <Button variant="secondary" size={(props.size as 'sm' | 'md') ?? 'md'}>
            Secondary
          </Button>
          <Button variant="ghost" size={(props.size as 'sm' | 'md') ?? 'md'}>
            Ghost
          </Button>
          <Button variant="primary" size={(props.size as 'sm' | 'md') ?? 'md'} destructive>
            Delete
          </Button>
          <Button variant="primary" size={(props.size as 'sm' | 'md') ?? 'md'} loading>
            Saving
          </Button>
        </>
      )
    },
  },
}
