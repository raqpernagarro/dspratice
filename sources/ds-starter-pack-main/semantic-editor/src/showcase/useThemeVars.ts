import { useMemo } from 'react'

import { figmaTokenToCssVar } from '../../../stories/base-ui/tokens/figma-css-var'
import { useSemanticEditor } from '../context/SemanticEditorContext'

/**
 * Reads live token values (Figma base + brand + configurator overrides) from <html>.
 * Re-reads after every theme apply.
 */
export function useTokens() {
  const { appliedVersion } = useSemanticEditor()
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement)
    const read = (path: string) => cs.getPropertyValue(figmaTokenToCssVar(path)).trim()
    return Object.assign(read, { version: appliedVersion })
  }, [appliedVersion])
}

/** CSS var() for a token path, for inline styles. */
export const tv = (path: string) => `var(${figmaTokenToCssVar(path)})`

/** First family in a CSS font stack, without quotes. */
export function primaryFamily(stack: string) {
  return stack.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '') || stack
}
