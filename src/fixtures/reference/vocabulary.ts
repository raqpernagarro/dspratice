// Copied from DSN `Design Tokens/vocabulary.json` (read-only reference, 21 Oct 2026).
// The closed vocabulary is what lets an agent be told "no" with a reason.

export const BANNED_WORDS: Record<string, string> = {
  pressed: 'active',
  inverted: 'inverse',
  palette: 'primitive',
  danger: 'error (status) or destructive (interactive prominence)',
  critical: 'error-strong',
  cta: 'interactive-primary',
  bg: 'background',
  text: 'foreground',
  spacing: 'space',
  subtle: 'soft or sm',
  small: 'sm',
  large: 'lg',
  xxl: '2xl',
  primaryColor: 'interactive-primary',
  brandColor: 'accent',
  grey: 'neutral',
  gray: 'neutral',
  highlight: 'accent-soft',
}

export const STATE_WORDS = ['default', 'hover', 'active', 'focus', 'disabled', 'selected'] as const

export const SEMANTIC_PATTERN = '<tier>-<aspect>-<role|step>[-<prominence>][-<state>]'

export const SEMANTIC_ROLES = [
  'neutral',
  'accent',
  'interactive',
  'status',
  'surface',
  'inverse',
  'info',
  'success',
  'warning',
  'error',
] as const

export const PROMINENCE = ['soft', 'default', 'strong'] as const

// DSN ds-index.json → tokens.absences: names agents keep inventing that do not exist (sample of the 46).
export const ABSENCES: string[] = [
  '--color-background-accent-soft does not exist',
  '--color-border-interactive-active does not exist',
  '--color-brand-pop does not exist',
  '--color-brand-primary does not exist',
  '--color-primary does not exist',
  '--color-text-default does not exist',
  '--color-bg-surface does not exist',
  '--space-xxl does not exist',
  '--radius-small does not exist',
  '--font-size-body does not exist',
  '--shadow-card does not exist',
  '--color-background-interactive-primary-pressed does not exist',
]

export const SPACE_SCALE_PX = [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
