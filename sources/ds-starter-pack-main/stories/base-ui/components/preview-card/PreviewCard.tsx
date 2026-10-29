import * as React from 'react'
import { PreviewCard as BasePreviewCard } from '@base-ui/react/preview-card'

import type { PopupSide } from '../shared/popup'
import '../shared/popup.css'
import './preview-card.css'
import './preview-card.tokens.css'

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

export interface PreviewCardPopupProps extends Omit<React.ComponentProps<typeof BasePreviewCard.Popup>, 'className'> {
  className?: string
  side?: React.ComponentProps<typeof BasePreviewCard.Positioner>['side']
  align?: React.ComponentProps<typeof BasePreviewCard.Positioner>['align']
  sideOffset?: number
  arrow?: boolean
}

function Popup({ className, side, align, sideOffset = 8, arrow = true, children, ...props }: PreviewCardPopupProps) {
  return (
    <BasePreviewCard.Portal>
      <BasePreviewCard.Positioner side={side} align={align} sideOffset={sideOffset}>
        <BasePreviewCard.Popup className={cx('ds-popup ds-preview-card', className)} {...props}>
          {arrow ? <BasePreviewCard.Arrow className="ds-arrow ds-preview-card__arrow" /> : null}
          {children}
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  )
}

/** The link that opens the card (an <a>). */
function Trigger({ className, ...props }: Omit<React.ComponentProps<typeof BasePreviewCard.Trigger>, 'className'> & { className?: string }) {
  return <BasePreviewCard.Trigger className={cx('ds-preview-card__trigger', className)} {...props} />
}

function Image({ className, ...props }: React.ComponentProps<'img'>) {
  return <img className={cx('ds-preview-card__image', className)} {...props} />
}

function Title({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cx('ds-preview-card__title', className)} {...props} />
}

function Summary({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cx('ds-preview-card__summary', className)} {...props} />
}

/** Styles: preview-card.css (layout) + preview-card.tokens.css (generated from preview-card.spec.ts). */
export const PreviewCard = { Root: BasePreviewCard.Root, Trigger, Popup, Image, Title, Summary }

/** The card drawn statically, as in Figma (docs, configurator). The image is its placeholder. */
export function PreviewCardPreview({ side = 'bottom' }: { side?: PopupSide }) {
  return (
    <div className="ds-popup ds-preview-card" data-preview>
      <div className="ds-arrow ds-preview-card__arrow" data-side={side} data-preview />
      <div className="ds-preview-card__image" role="presentation" />
      <p className="ds-preview-card__title">Typography</p>
      <p className="ds-preview-card__summary">The art and science of arranging type to make written language clear and appealing.</p>
    </div>
  )
}
