import { useMemo } from 'react'
import { useStore } from '@/state/store'
import { useSystem } from '@/state/hooks'
import { intentsFromTheme, type ThemeIntents } from './intents'
import type { BrandId, Mode } from '@/state/types'

/** The current project's theme as intents, optionally for a specific brand and mode. */
export function useResolvedTheme(brand?: BrandId | string, mode?: Mode): ThemeIntents {
  const theme = useSystem().theme
  const previewBrand = useStore((s) => s.ui.previewBrand)
  const previewMode = useStore((s) => s.ui.previewMode)
  const b = brand ?? previewBrand ?? theme.activeBrand
  const m = mode ?? previewMode ?? theme.designedFirst
  return useMemo(() => intentsFromTheme(theme, b, m), [theme, b, m])
}
