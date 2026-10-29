import { useEffect } from 'react'
import type { Decorator } from '@storybook/react'

import { applyTheme } from '../stories/base-ui/tokens/theme-generator'
import { loadStoredTheme } from '../stories/base-ui/tokens/theme-storage'

export const withSemanticTheme: Decorator = (Story) => {
  useEffect(() => {
    applyTheme(document.documentElement, loadStoredTheme())
  }, [])

  return (
    <div className="theme-scope" style={{ minHeight: '100%' }}>
      <Story />
    </div>
  )
}
