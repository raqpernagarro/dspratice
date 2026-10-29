import * as React from 'react'
import { Slider as BaseSlider } from '@base-ui/react/slider'

import { useControlSize } from '../shared/control-size'
import './slider.css'
import './slider.tokens.css'
import type { SliderSize } from './slider.spec'

export type { SliderSize }

export interface SliderProps extends Omit<React.ComponentProps<typeof BaseSlider.Root>, 'className'> {
  /** Defaults to the enclosing Field's size, else md. */
  size?: SliderSize
  className?: string
  /** Labels for the thumbs, in order (one per value). */
  thumbLabels?: string[]
  /** Static state preview (docs, configurator). */
  'data-preview-state'?: 'hover' | 'focused'
}

/** Styles: slider.css (layout) + slider.tokens.css (generated from slider.spec.ts). */
export function Slider({ size: sizeProp, className, thumbLabels, 'data-preview-state': previewState, ...props }: SliderProps) {
  const contextSize = useControlSize()
  const size = sizeProp ?? contextSize ?? 'md'
  const value = props.value ?? props.defaultValue
  const thumbs = Array.isArray(value) ? value.length : 1
  return (
    <BaseSlider.Root className="ds-slider__root" {...props}>
      <BaseSlider.Control className={['ds-slider', className].filter(Boolean).join(' ')} data-size={size} data-preview-state={previewState}>
        <BaseSlider.Track className="ds-slider__track">
          <BaseSlider.Indicator className="ds-slider__indicator" />
          {Array.from({ length: thumbs }, (_, i) => (
            <BaseSlider.Thumb key={i} index={i} className="ds-slider__thumb" aria-label={thumbLabels?.[i]} />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  )
}
