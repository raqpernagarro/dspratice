import * as React from 'react'
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'

import type { PopupSide } from '../shared/popup'
import '../shared/popup.css'
import './tooltip.css'
import './tooltip.tokens.css'

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

export interface TooltipPopupProps extends Omit<React.ComponentProps<typeof BaseTooltip.Popup>, 'className'> {
  className?: string
  side?: React.ComponentProps<typeof BaseTooltip.Positioner>['side']
  align?: React.ComponentProps<typeof BaseTooltip.Positioner>['align']
  sideOffset?: number
  /** Show the arrow pointing at the trigger (default true). */
  arrow?: boolean
}

/** Portal + positioner + popup (+ arrow). */
function Popup({ className, side, align, sideOffset = 10, arrow = true, children, ...props }: TooltipPopupProps) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} align={align} sideOffset={sideOffset}>
        <BaseTooltip.Popup className={cx('ds-popup ds-tooltip', className)} {...props}>
          {arrow ? <BaseTooltip.Arrow className="ds-arrow ds-tooltip__arrow" /> : null}
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  )
}

/**
 * Styles: tooltip.css (layout) + tooltip.tokens.css (generated from tooltip.spec.ts).
 * The trigger is any focusable control: `<Tooltip.Trigger render={<IconButton … />} />`.
 */
export const Tooltip = {
  Provider: BaseTooltip.Provider,
  Root: BaseTooltip.Root,
  Trigger: BaseTooltip.Trigger,
  Popup,
}

/** The popup drawn statically, as in Figma (docs, configurator). */
export function TooltipPreview({ side = 'bottom', children = 'Bold' }: { side?: PopupSide; children?: React.ReactNode }) {
  return (
    <div className="ds-popup ds-tooltip" data-preview>
      <div className="ds-arrow ds-tooltip__arrow" data-side={side} data-preview />
      {children}
    </div>
  )
}
