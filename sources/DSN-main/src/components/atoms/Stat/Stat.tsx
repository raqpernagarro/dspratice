import React from 'react';
import './Stat.css';

export type StatVariant = 'default' | 'card';

export interface StatProps {
  /** Short label describing the metric. */
  title: string;
  /** Main metric value. Keep concise (e.g. 1234, 84%, 1.2k). */
  value: React.ReactNode;
  /** Layout treatment: plain or card-contained. */
  variant?: StatVariant;
  /** Additional CSS class names merged on root. */
  className?: string;
  /** Optional aria-label for standalone accessibility context. */
  'aria-label'?: string;
}

/**
 * Title + value pair displaying a single metric, plain or card-contained.
 *
 * @aiSelectWhen Displaying a single KPI or metric with a short label — dashboard tiles, summary rows
 *
 * @aiAvoid Do not use for an interactively editable value — use NumberInput or a form field instead
 * @aiAvoid Do not use for long-form or paragraph content — Stat is for concise, at-a-glance metrics only
 *
 * @aiVariant variant="default" — already inside another container (e.g. a Card)
 * @aiVariant variant="card" — standalone, needs its own card-like visual treatment
 *
 * @aiSpatial variant="card" owns its own container padding; variant="default" has no outer padding
 *
 * @aiCompose Never use variant="card" for a Stat already mounted inside a Card — creates a nested card-in-card visual
 */
export function Stat({
  title,
  value,
  variant = 'default',
  className,
  'aria-label': ariaLabel,
}: StatProps) {
  const rootClass = ['dsn-stat', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-variant={variant} aria-label={ariaLabel}>
      <p className="dsn-stat-title">{title}</p>
      <p className="dsn-stat-value">{value}</p>
    </div>
  );
}

export default Stat;
