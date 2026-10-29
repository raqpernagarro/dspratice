import React, { useId } from 'react';
import './HorizontalInput.css';

export interface HorizontalInputProps {
  /** Label text shown in the left column. */
  label: string;
  /** Optional help/description text shown under the label. */
  description?: string;
  /** Controls whether description text is rendered. */
  showDescription?: boolean;
  /** Renders the optional leading icon in the label row. */
  showIcon?: boolean;
  /** Optional custom icon for the label row when showIcon=true. */
  iconSlot?: React.ReactNode;
  /** Error styles for label and description. */
  error?: boolean;
  /** Left-column width to align multiple horizontal rows. */
  labelWidth?: string;
  /** Content slot for any existing input control. */
  children: React.ReactNode;
  className?: string;
}

function DefaultHorizontalInputIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5L13.5 8L8 13.5L2.5 8L8 2.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Layout wrapper that positions a label to the left of an embedded input control.
 *
 * @aiSelectWhen Dense settings panels or property editors where vertical space is at a premium
 *
 * @aiAvoid Do not use in standard top-to-bottom scannable forms — use the control's stacked layout instead
 * @aiAvoid Do not use in mobile layouts — use the stacked layout instead
 * @aiAvoid Do not use with long labels that would wrap — keep labels short or use the stacked layout
 *
 * @aiSpatial No outer padding; fills container width, content column takes remaining width after the label column
 *
 * @aiCompose Never render the embedded control's own visible label inside children — HorizontalInput already owns and associates the label
 */
export function HorizontalInput({
  label,
  description,
  showDescription = true,
  showIcon = false,
  iconSlot,
  error = false,
  labelWidth,
  children,
  className,
}: HorizontalInputProps) {
  const autoId = useId();
  const labelId = `dsn-horizontal-input-label-${autoId}`;
  const descriptionId = `dsn-horizontal-input-description-${autoId}`;
  const renderDescription = showDescription && Boolean(description);
  const resolvedIcon = iconSlot ?? <DefaultHorizontalInputIcon />;

  const style = {
    ...(labelWidth ? { '--dsn-horizontal-input-label-width': labelWidth } : {}),
  } as React.CSSProperties;

  return (
    <div
      className={['dsn-horizontal-input', className].filter(Boolean).join(' ')}
      data-error={error || undefined}
      data-has-icon={showIcon || undefined}
      style={style}
    >
      <div className="dsn-horizontal-input-row">
        <div className="dsn-horizontal-input-meta">
          {showIcon && (
            <span className="dsn-horizontal-input-icon" aria-hidden="true">
              {resolvedIcon}
            </span>
          )}

          <div className="dsn-horizontal-input-text">
            <div className="dsn-horizontal-input-label-row">
              <span id={labelId} className="dsn-horizontal-input-label">
                {label}
              </span>
            </div>

            {renderDescription && (
              <p id={descriptionId} className="dsn-horizontal-input-description">
                {description}
              </p>
            )}
          </div>
        </div>

        <div
          className="dsn-horizontal-input-content"
          role="group"
          aria-labelledby={labelId}
          aria-describedby={renderDescription ? descriptionId : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default HorizontalInput;
