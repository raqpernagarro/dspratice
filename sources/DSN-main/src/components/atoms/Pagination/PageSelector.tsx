import './PageSelector.css';

export interface PageSelectorProps {
  /** The page number to display. */
  page: number;
  /** Marks this selector as the current page. Adds `aria-current="page"` and teal border. */
  selected?: boolean;
  /** Prevents interaction. */
  disabled?: boolean;
  /** Called when the selector is clicked. */
  onClick?: () => void;
  className?: string;
}

/**
 * Single numbered page button rendered inside Pagination's page-range row.
 *
 * @aiAvoid Do not mount standalone to build a custom page-number row — use Pagination instead
 * @aiAvoid Do not use as a generic numbered button outside a pagination context — use Button instead
 *
 * @aiSpatial Sized intrinsically to its numeric label; spacing between selectors comes from the parent Pagination layout
 *
 * @aiCompose Always a child of Pagination — exactly one PageSelector in the row should have selected=true at a time
 */
export function PageSelector({
  page,
  selected = false,
  disabled = false,
  onClick,
  className,
}: PageSelectorProps) {
  return (
    <button
      type="button"
      className={`dsn-page-selector${className ? ` ${className}` : ''}`}
      data-selected={selected || undefined}
      disabled={disabled}
      aria-current={selected ? 'page' : undefined}
      onClick={disabled ? undefined : onClick}
    >
      <span className="dsn-page-selector-number">{page}</span>
    </button>
  );
}

export default PageSelector;
