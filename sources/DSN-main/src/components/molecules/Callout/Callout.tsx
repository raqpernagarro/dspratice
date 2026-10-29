import React from 'react';
import { AlertTriangle, Check, CircleX, Info, X } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { Toolbar } from '../Toolbar';
import './Callout.css';

export type CalloutSeverity = 'default' | 'success' | 'warning' | 'error';

export interface CalloutProps {
  /** Semantic meaning and visual treatment of the callout. */
  severity?: CalloutSeverity;
  /** Short, outcome-first heading. */
  title: string;
  /** Optional supporting text. */
  description?: string;
  /** Optional custom icon to override severity default. */
  icon?: React.ReactNode;
  /** Optional area rendered between header and footer for richer context. */
  content?: React.ReactNode;
  /** Optional controls rendered in the bottom-right area. */
  actions?: React.ReactNode;
  /** Optional supporting control/label area rendered bottom-left. */
  supporting?: React.ReactNode;
  /** Whether to show a dismiss control in the header. */
  dismissible?: boolean;
  /** Accessible label for the dismiss control. */
  dismissLabel?: string;
  /** Called when dismiss control is clicked. */
  onDismiss?: () => void;
  /** Additional CSS class names. */
  className?: string;
}

function getDefaultIcon(severity: CalloutSeverity): React.ReactNode {
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
 * Inline, dismissible message panel with severity icon, title, and optional footer actions.
 *
 * @aiSelectWhen A contextual inline message tied to a specific page/section area
 *
 * @aiAvoid Do not use for a transient auto-dismissing confirmation — use Toast instead
 * @aiAvoid Do not use for a blocking confirmation the user must acknowledge — use AlertDialog instead
 * @aiAvoid Do not use for form-field-level validation — use the field's own error/errorMessage props instead
 *
 * @aiVariant severity="default" — neutral, informational
 * @aiVariant severity="success" — confirms a completed action or healthy state
 * @aiVariant severity="warning" — caution, non-blocking issue
 * @aiVariant severity="error" — role="alert", aria-live="assertive"; use sparingly for genuine blocking errors
 *
 * @aiSpatial Owns its own padding; fills its container width
 *
 * @aiCompose Composes Button and Toolbar internally for dismiss/footer actions — never mount a separate Toolbar below it
 */
export function Callout({
  severity = 'default',
  title,
  description,
  icon,
  content,
  actions,
  supporting,
  dismissible = true,
  dismissLabel = 'Dismiss callout',
  onDismiss,
  className,
}: CalloutProps) {
  const hasContent = Boolean(content);
  const hasFooter = Boolean(actions) || Boolean(supporting);
  const role = severity === 'error' ? 'alert' : 'status';
  const ariaLive = severity === 'error' ? 'assertive' : 'polite';

  return (
    <section
      className={['dsn-callout', className].filter(Boolean).join(' ')}
      data-severity={severity}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
    >
      <div className="dsn-callout-header">
        <span className="dsn-callout-icon" aria-hidden="true">
          {icon ?? getDefaultIcon(severity)}
        </span>

        <div className="dsn-callout-text">
          <p className="dsn-callout-title">{title}</p>
          {description ? <p className="dsn-callout-description">{description}</p> : null}
        </div>

        {dismissible ? (
          <Button
            className="dsn-callout-dismiss"
            variant="ghost"
            size="sm"
            showLabel={false}
            showLeadingIcon
            leadingIcon={<X size={16} aria-hidden="true" />}
            aria-label={dismissLabel}
            onClick={onDismiss}
          />
        ) : null}
      </div>

      {hasContent ? <div className="dsn-callout-content">{content}</div> : null}

      {hasFooter ? (
        <Toolbar
          size="sm"
          variant="plain"
          leftActions={supporting}
          rightActions={actions}
          aria-label="Callout actions"
        />
      ) : null}
    </section>
  );
}

export default Callout;
