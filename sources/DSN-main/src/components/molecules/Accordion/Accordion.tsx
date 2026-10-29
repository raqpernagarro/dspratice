import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SectionHeader } from '../../atoms/SectionHeader';
import './Accordion.css';

export type AccordionDisclosure = 'left' | 'right';

export interface AccordionProps {
  title: string;
  description?: string;
  disclosure?: AccordionDisclosure;
  bordered?: boolean;
  expanded?: boolean;
  defaultExpanded?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  onExpandedChange?: (expanded: boolean) => void;
}

/**
 * Collapsible disclosure section with a SectionHeader trigger and expandable content.
 *
 * @aiSelectWhen Progressively disclosing secondary content the user doesn't need by default
 *
 * @aiAvoid Do not use for primary content the user needs immediately — show it directly instead
 * @aiAvoid Do not use for mutually exclusive named views — use Tab or SegmentControl instead
 *
 * @aiVariant disclosure="left" — default, chevron leads the title
 * @aiVariant disclosure="right" — chevron trails, e.g. matching a list of similar rows
 *
 * @aiSpatial Owns its own padding; fills its container width
 *
 * @aiCompose Renders its trigger via SectionHeader internally — never mount a second SectionHeader as the first child
 */
export function Accordion({
  title,
  description,
  disclosure = 'left',
  bordered = false,
  expanded,
  defaultExpanded = false,
  disabled = false,
  children,
  className,
  contentClassName,
  onExpandedChange,
}: AccordionProps) {
  const autoId = useId();
  const triggerId = `dsn-accordion-trigger-${autoId}`;
  const contentId = `dsn-accordion-content-${autoId}`;
  const isControlled = expanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = isControlled ? expanded : internalExpanded;

  const rootClass = ['dsn-accordion', className].filter(Boolean).join(' ');
  const contentClass = ['dsn-accordion-content-padding', contentClassName].filter(Boolean).join(' ');
  const icon = <ChevronDown size={16} aria-hidden="true" />;

  function setExpanded(nextExpanded: boolean) {
    if (!isControlled) {
      setInternalExpanded(nextExpanded);
    }
    onExpandedChange?.(nextExpanded);
  }

  function renderIcon() {
    return <span className="dsn-accordion-disclosure-icon">{icon}</span>;
  }

  return (
    <div
      className={rootClass}
      data-bordered={bordered || undefined}
      data-expanded={isExpanded || undefined}
      data-disclosure={disclosure}
      data-disabled={disabled || undefined}
    >
      <button
        id={triggerId}
        type="button"
        className="dsn-accordion-trigger"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        disabled={disabled}
        onClick={() => setExpanded(!isExpanded)}
      >
        <SectionHeader
          title={title}
          description={description}
          size="medium"
          flush={!bordered}
          leadingControl={disclosure === 'left' ? renderIcon() : undefined}
          trailingControl={disclosure === 'right' ? renderIcon() : undefined}
          className="dsn-accordion-section-header"
        />
      </button>

      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className="dsn-accordion-content"
        hidden={!isExpanded}
      >
        <div className="dsn-accordion-content-inner">
          <div className={contentClass}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Accordion;
