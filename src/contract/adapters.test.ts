import { describe, expect, it } from 'vitest'
import { mapDsn, mapKit, mapStarter, mapGrammar, summarise } from './adapters'
import { DSN_SAMPLE, KIT_SAMPLE, STARTER_SAMPLE } from '@/fixtures/reference/grammars'
import { validateReferences } from './validate'
import { DEMO_TOKENS } from '@/fixtures/demo-brand/tokens'

describe('token grammar adapters', () => {
  it('DSN is already the contract grammar; accent-strong needs a decision', () => {
    expect(mapDsn('--color-background-interactive-primary-hover').contractPath).toBe('color.background.interactive.primary.hover')
    expect(mapDsn('--color-background-accent-strong-default').status).toBe('needs-decision')
  })
  it('Starter Pack: slash paths map; "pressed" is a banned word', () => {
    expect(mapStarter('color/background/interactive/primary/default')).toMatchObject({ status: 'mapped', contractPath: 'color.background.interactive.primary.default' })
    expect(mapStarter('color/background/interactive/primary/pressed')).toMatchObject({ status: 'needs-decision', contractPath: 'color.background.interactive.primary.active' })
  })
  it('kit: role prefixes map to contract roles; device stays unmapped', () => {
    expect(mapKit('--ds-semantic-color-action-primary-hover').contractPath).toBe('color.background.interactive.primary.hover')
    expect(mapKit('--ds-semantic-color-text-primary-default').contractPath).toBe('color.foreground.neutral.default')
    expect(mapKit('--ds-device-breakpoint-tablet').status).toBe('unmapped')
  })
  it('summaries never claim 100% for a foreign grammar', () => {
    for (const [id, names] of [['dsn', DSN_SAMPLE], ['starter', STARTER_SAMPLE], ['kit', KIT_SAMPLE]] as const) {
      const s = summarise(mapGrammar(id, [...names]))
      expect(s.total).toBe(names.length)
      expect(s.mapped).toBeGreaterThan(0)
      if (id !== 'dsn') expect(s.mapped).toBeLessThan(s.total)
    }
  })
})

describe('validator', () => {
  it('passes a clean prompt', () => {
    const r = validateReferences('A settings page with --color-background-interactive-primary-default and 16px gaps', DEMO_TOKENS)
    expect(r.refused).toEqual([])
    expect(r.checks.every((c) => c.status === 'pass')).toBe(true)
  })
})
