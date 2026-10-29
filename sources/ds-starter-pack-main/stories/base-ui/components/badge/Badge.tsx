import * as React from 'react'

import './badge.css'
import './badge.tokens.css'
import type { BadgeSize, BadgeType } from './badge.spec'

export type { BadgeSize, BadgeType }

export interface BadgeProps extends Omit<React.ComponentProps<'span'>, 'className'> {
  /** Figma's Type: a status color, or neutral grey. */
  type?: BadgeType
  size?: BadgeSize
  className?: string
}

/** Styles: badge.css (layout) + badge.tokens.css (generated from badge.spec.ts). */
export function Badge({ type = 'neutral', size = 'md', className, ...props }: BadgeProps) {
  return <span className={['ds-badge', className].filter(Boolean).join(' ')} data-type={type} data-size={size} {...props} />
}
