import * as React from 'react'
import { Progress as BaseProgress } from '@base-ui/react/progress'

import { gauge } from '../shared/GaugeView'
import './progress.css'
import './progress.tokens.css'

export interface ProgressProps extends Omit<React.ComponentProps<typeof BaseProgress.Root>, 'className' | 'children'> {
  label?: React.ReactNode
  /** Show the formatted value next to the label (default true). */
  showValue?: boolean
  className?: string
}

const Gauge = gauge('progress', BaseProgress)

/**
 * Styles: progress.css (layout, indeterminate animation) + progress.tokens.css (generated from
 * progress.spec.ts). value={null} is indeterminate.
 */
export function Progress(props: ProgressProps) {
  return <Gauge {...props} />
}
