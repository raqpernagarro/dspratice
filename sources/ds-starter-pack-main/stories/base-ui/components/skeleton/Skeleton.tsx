import * as React from 'react'

import './skeleton.css'
import './skeleton.tokens.css'
import type { SkeletonShape } from './skeleton.spec'

export type { SkeletonShape }

export interface SkeletonProps extends Omit<React.ComponentProps<'span'>, 'className' | 'children'> {
  /** Figma's Shape: a line of text, a circle (avatar) or a block (image, card). */
  shape?: SkeletonShape
  /** Width, e.g. '60%' for a short last line, or a block's size. */
  width?: React.CSSProperties['width']
  /** A block's height. */
  height?: React.CSSProperties['height']
  className?: string
}

/** Styles: skeleton.css (layout, pulse) + skeleton.tokens.css (generated from skeleton.spec.ts). */
export function Skeleton({ shape = 'text', width, height, className, style, ...props }: SkeletonProps) {
  return <span aria-hidden className={['ds-skeleton', className].filter(Boolean).join(' ')} data-shape={shape} style={{ width, height, ...style }} {...props} />
}
