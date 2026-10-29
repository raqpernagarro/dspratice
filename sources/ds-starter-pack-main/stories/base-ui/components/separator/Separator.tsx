import * as React from 'react'
import { Separator as BaseSeparator } from '@base-ui/react/separator'

import './separator.css'
import './separator.tokens.css'

/** Styles: separator.css (layout, vertical orientation) + separator.tokens.css (generated from separator.spec.ts). */
export function Separator({ className, ...props }: Omit<React.ComponentProps<typeof BaseSeparator>, 'className'> & { className?: string }) {
  return <BaseSeparator className={['ds-separator', className].filter(Boolean).join(' ')} {...props} />
}
