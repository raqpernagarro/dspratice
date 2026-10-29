import { Toast as BaseToast } from '@base-ui/react/toast'
import { CheckCircle, Info, Warning, XCircle } from '@phosphor-icons/react'

import { Button } from '../button/Button'
import './toast.css'
import './toast.tokens.css'
import type { ToastType } from './toast.spec'

export type { ToastType }

const ICONS = { neutral: Info, success: CheckCircle, warning: Warning, error: XCircle }

function TypeIcon({ type }: { type?: string }) {
  const Icon = ICONS[(type as ToastType) ?? 'neutral'] ?? Info
  return (
    <span className="ds-toast__icon" aria-hidden>
      <Icon weight="fill" />
    </span>
  )
}

/** Where toasts stack (bottom right). Render once, inside Toast.Provider. */
function Viewport({ showIcon = true }: { showIcon?: boolean }) {
  return (
    <BaseToast.Portal>
      <BaseToast.Viewport className="ds-toast-viewport">
        <List showIcon={showIcon} />
      </BaseToast.Viewport>
    </BaseToast.Portal>
  )
}

function List({ showIcon }: { showIcon: boolean }) {
  const { toasts } = BaseToast.useToastManager()
  return toasts.map((toast) => (
    <BaseToast.Root key={toast.id} toast={toast} className="ds-toast">
      <BaseToast.Content className="ds-toast__content">
        {showIcon ? <TypeIcon type={toast.type} /> : null}
        <div className="ds-toast__text">
          <BaseToast.Title className="ds-toast__title" />
          <BaseToast.Description className="ds-toast__description" />
        </div>
        <BaseToast.Close className="ds-toast__close" render={<Button variant="secondary" />}>
          Dismiss
        </BaseToast.Close>
      </BaseToast.Content>
    </BaseToast.Root>
  ))
}

/**
 * Styles: toast.css (layout, stacking) + toast.tokens.css (generated from toast.spec.ts).
 *   <Toast.Provider> … <Toast.Viewport /> </Toast.Provider>, then
 *   Toast.useToastManager().add({ title, description, type: 'success' | 'warning' | 'error' })
 */
export const Toast = { Provider: BaseToast.Provider, Viewport, useToastManager: BaseToast.useToastManager }

/** One toast drawn statically, as in Figma (docs, configurator). */
export function ToastPreview({ type = 'neutral', title = 'Message sent', description = 'Your message is on its way.' }: { type?: ToastType; title?: string; description?: string }) {
  return (
    <div className="ds-toast" data-preview data-type={type}>
      <div className="ds-toast__content">
        <TypeIcon type={type} />
        <div className="ds-toast__text">
          <div className="ds-toast__title">{title}</div>
          <div className="ds-toast__description">{description}</div>
        </div>
        <Button className="ds-toast__close" variant="secondary" tabIndex={-1}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
