import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, CircleX, Info, X } from 'lucide-react';
import { Button } from '../../atoms/Button';
import './Toast.css';

export type ToastSeverity = 'default' | 'success' | 'warning' | 'error';
export type ToastVariant = 'inline' | 'rich';

export interface ToastProps {
  /** Visual density and content structure. */
  variant?: ToastVariant;
  /** Semantic meaning of the notification. */
  severity?: ToastSeverity;
  /** Short, outcome-first heading. */
  title: string;
  /** Optional supporting text. */
  description?: string;
  /** Optional CTA label rendered as a secondary small button. */
  actionLabel?: string;
  /** Called when the CTA is clicked. */
  onAction?: () => void;
  /** Whether to show dismiss control. */
  dismissible?: boolean;
  /** Accessible label for the dismiss control. */
  dismissLabel?: string;
  /** Called when the dismiss control is clicked. */
  onDismiss?: () => void;
  /**
   * Auto-dismiss after a few seconds. Ignored (never auto-dismisses) for `severity="error"` and for
   * any toast with `actionLabel`, so users have time to read and act (WCAG 2.2.1).
   */
  autoDismiss?: boolean;
  /** Optional custom leading icon. */
  icon?: React.ReactNode;
  /**
   * Extra content below the description (e.g. a progress bar or attachment).
   * Rich variant only. Figma: `Content` / `Show content` on Toast / Rich toast.
   */
  content?: React.ReactNode;
  /** Additional CSS class names. */
  className?: string;
}

const AUTO_DISMISS_MS = 5000;
const EXIT_ANIMATION_MS = 200;

function getDefaultSeverityIcon(severity: ToastSeverity): React.ReactNode {
  switch (severity) {
    case 'success':
      return <Check size={16} aria-hidden="true" />;
    case 'warning':
      return <AlertTriangle size={16} aria-hidden="true" />;
    case 'error':
      return <CircleX size={16} aria-hidden="true" />;
    case 'default':
    default:
      return <Info size={16} aria-hidden="true" />;
  }
}

/**
 * Brief, non-blocking notification with a severity icon, title, optional description/action, and dismiss control.
 *
 * @aiSelectWhen Confirming a user-initiated action completed (e.g. "Changes saved")
 * @aiSelectWhen Surfacing a background system event or non-critical warning/error
 *
 * @aiAvoid Do not use when the user must act before continuing — use Modal instead
 * @aiAvoid Do not use for form-field-specific feedback — use inline field validation instead
 *
 * @aiVariant variant="inline" — single-line confirmations and simple status updates; use by default
 * @aiVariant variant="rich" — only when a description or single follow-up action is genuinely needed
 * @aiVariant severity="success" — result of a user-initiated action that completed as expected (most common)
 * @aiVariant severity="warning" — a real concern, used sparingly, never to soften an error
 * @aiVariant severity="error" — genuine failures only
 *
 * @aiSpatial Owns its internal padding but not its own positioning — placement within the viewport/stack is handled by the surrounding toast container, capped at 3 visible at once.
 *
 * @aiCompose Never include more than one action button in a rich Toast
 */
export function Toast({
  variant = 'inline',
  severity = 'default',
  title,
  description,
  actionLabel,
  onAction,
  dismissible = true,
  dismissLabel = 'Dismiss notification',
  onDismiss,
  autoDismiss = true,
  icon,
  content,
  className,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveredRef = useRef(false);
  const hasFocusWithinRef = useRef(false);
  const canAutoDismiss = autoDismiss && severity !== 'error' && !actionLabel;

  const clearDismissTimer = useCallback(() => {
    if (!dismissTimerRef.current) {
      return;
    }

    clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
  }, []);

  const scheduleDismissTimer = useCallback(() => {
    clearDismissTimer();
    if (isExiting || !canAutoDismiss || isHoveredRef.current || hasFocusWithinRef.current) {
      return;
    }

    dismissTimerRef.current = setTimeout(() => {
      setIsExiting(true);
    }, AUTO_DISMISS_MS);
  }, [canAutoDismiss, clearDismissTimer, isExiting]);

  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
    clearDismissTimer();
  }, [clearDismissTimer]);

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
    scheduleDismissTimer();
  }, [scheduleDismissTimer]);

  const handleFocus = useCallback(() => {
    hasFocusWithinRef.current = true;
    clearDismissTimer();
  }, [clearDismissTimer]);

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const next = event.relatedTarget as Node | null;
      if (next && event.currentTarget.contains(next)) {
        return;
      }
      hasFocusWithinRef.current = false;
      scheduleDismissTimer();
    },
    [scheduleDismissTimer],
  );

  useEffect(() => {
    scheduleDismissTimer();
    return () => {
      clearDismissTimer();
    };
  }, [clearDismissTimer, scheduleDismissTimer]);

  useEffect(() => {
    if (!isExiting) {
      return;
    }

    clearDismissTimer();
    exitTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, EXIT_ANIMATION_MS);

    return () => {
      if (!exitTimerRef.current) {
        return;
      }
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    };
  }, [clearDismissTimer, isExiting, onDismiss]);

  const ariaLive = severity === 'error' ? 'assertive' : 'polite';
  const role = severity === 'error' ? 'alert' : 'status';

  const showDescription = variant === 'rich' && Boolean(description);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={['dsn-toast', className].filter(Boolean).join(' ')}
      data-severity={severity}
      data-variant={variant}
      data-state={isExiting ? 'exit' : 'enter'}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <span className="dsn-toast-icon-wrapper" aria-hidden="true">
        <span className="dsn-toast-icon">
          {icon ?? getDefaultSeverityIcon(severity)}
        </span>
      </span>

      <div className="dsn-toast-content">
        <div className="dsn-toast-title">{title}</div>
        {showDescription ? <div className="dsn-toast-description">{description}</div> : null}
        {variant === 'rich' && content ? <div className="dsn-toast-slot">{content}</div> : null}
      </div>

      {actionLabel ? (
        <Button className="dsn-toast-action" variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}

      {dismissible ? (
        <Button
          className="dsn-toast-dismiss"
          variant="ghost"
          size="sm"
          showLabel={false}
          showLeadingIcon
          leadingIcon={<X size={16} aria-hidden="true" />}
          aria-label={dismissLabel}
          onClick={() => setIsExiting(true)}
        />
      ) : null}
    </div>
  );
}

export default Toast;
