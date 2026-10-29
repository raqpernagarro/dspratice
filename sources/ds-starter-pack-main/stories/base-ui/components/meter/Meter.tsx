import * as React from 'react'
import { Meter as BaseMeter } from '@base-ui/react/meter'

import { gauge } from '../shared/GaugeView'
import '../progress/progress.css'
import './meter.tokens.css'

export interface MeterProps extends Omit<React.ComponentProps<typeof BaseMeter.Root>, 'className' | 'children'> {
  label?: React.ReactNode
  showValue?: boolean
  className?: string
}

const Gauge = gauge('meter', BaseMeter)

/** Styles: progress.css (shared gauge layout) + meter.tokens.css (generated from meter.spec.ts). */
export function Meter(props: MeterProps) {
  return <Gauge {...props} />
}
