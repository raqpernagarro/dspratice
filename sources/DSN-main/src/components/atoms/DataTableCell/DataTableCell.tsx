import React from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  Diamond,
  ExternalLink,
  FileText,
  Mail,
  Maximize2,
  MessageCircle,
  PanelRight,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarGroup } from '../Avatar';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { Checkbox } from '../Checkbox';
import { MenuCell, type MenuCellProps } from '../MenuCell';
import { Switcher } from '../Switcher';
import { Tag, type TagVariant } from '../Tag';
import { PopoverWrapper, isPointerInsideAnchoredPopover } from '../../molecules/PopoverWrapper';
import type { DataTableCellAction, DataTableCellAlign, DataTableFieldType } from '../../../types/common';
import './DataTableCell.css';

export type DataTableCellState = 'default' | 'hover';

/** Person value used by `main`, `single-user`, `multi-user`, `contact`, `contacts`, `contacts-list`. */
export interface DataTableUserValue {
  name: string;
  initials?: string;
  src?: string;
}

/** Tag value used by `tags-*` field types. A plain string renders with the default variant. */
export interface DataTableTagValue {
  label: string;
  variant?: TagVariant;
}

/** Button value used by the `buttons` field type. */
export interface DataTableButtonValue {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
}

export interface DataTableCellProps {
  fieldType?: DataTableFieldType;
  /** `hover` forces the hover look and actions (static previews). */
  state?: DataTableCellState;
  loading?: boolean;
  value?: unknown;
  width?: number;
  onCheckboxChange?: (checked: boolean) => void;
  /**
   * Fired when a hover action (or the `expand` toggle) is pressed.
   * `copy`, `open-external`, `email` and `call` have built-in behaviour; call
   * `event.preventDefault()` to replace it.
   */
  onAction?: (action: DataTableCellAction, value: unknown, event: React.MouseEvent<HTMLElement>) => void;
  /**
   * Render hover actions in every state and reveal them on pointer hover / keyboard focus
   * (used by DataTable). When false, actions only render for `state="hover"`.
   * @default false
   */
  revealActionsOnHover?: boolean;
  leadingAccessory?: React.ReactNode;
  align?: DataTableCellAlign;
  className?: string;
  'aria-label'?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  row?: Record<string, unknown>;
}

type ResolvedFieldType = Exclude<DataTableFieldType, 'tag' | 'user'>;

const FIELD_TYPE_ALIASES: Partial<Record<DataTableFieldType, ResolvedFieldType>> = {
  tag: 'tags-multi',
  user: 'single-user',
};

function resolveFieldType(fieldType: DataTableFieldType): ResolvedFieldType {
  return FIELD_TYPE_ALIASES[fieldType] ?? (fieldType as ResolvedFieldType);
}

/** Hover actions per field type, in Figma order. */
const HOVER_ACTIONS: Record<ResolvedFieldType, DataTableCellAction[]> = {
  main: ['open', 'side-panel'],
  string: ['copy'],
  text: ['copy', 'edit', 'delete'],
  'long-text': ['copy', 'edit', 'delete'],
  email: ['email', 'copy', 'edit', 'delete'],
  phone: ['message', 'call', 'edit', 'delete'],
  address: ['copy', 'edit', 'delete'],
  contact: ['menu', 'delete'],
  contacts: ['menu', 'delete'],
  'contacts-list': ['add', 'delete'],
  datetime: ['calendar', 'delete'],
  date: ['calendar', 'delete'],
  'month-year': ['calendar', 'delete'],
  number: ['edit', 'delete'],
  range: ['edit', 'delete'],
  'single-choice': ['menu', 'delete'],
  'multi-choice': ['menu', 'delete'],
  'single-user': ['menu', 'delete'],
  'multi-user': ['menu', 'delete'],
  url: ['edit', 'delete'],
  'url-readonly': ['open-external'],
  boolean: [],
  buttons: [],
  'tags-single': [],
  'tags-multi': ['menu'],
  'tags-readonly': [],
  file: ['upload', 'delete'],
  checkbox: [],
  expand: [],
  empty: [],
  icon: [],
};

const ACTION_META: Record<DataTableCellAction, { icon: LucideIcon; label: string }> = {
  copy: { icon: Copy, label: 'Copy value' },
  edit: { icon: Pencil, label: 'Edit value' },
  delete: { icon: Trash2, label: 'Delete value' },
  open: { icon: Maximize2, label: 'Open record' },
  'side-panel': { icon: PanelRight, label: 'Open in side panel' },
  menu: { icon: ChevronDown, label: 'Show options' },
  calendar: { icon: Calendar, label: 'Open date picker' },
  email: { icon: Mail, label: 'Send email' },
  call: { icon: Phone, label: 'Call' },
  message: { icon: MessageCircle, label: 'Send message' },
  upload: { icon: UploadCloud, label: 'Upload file' },
  add: { icon: Plus, label: 'Add item' },
  'open-external': { icon: ExternalLink, label: 'Open link in new tab' },
  expand: { icon: ChevronRight, label: 'Expand row' },
};

const TAG_VARIANTS: TagVariant[] = ['highlight', 'warning', 'error', 'success', 'neutral'];

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
}

function toUser(value: unknown): DataTableUserValue {
  if (value && typeof value === 'object' && 'name' in value) return value as DataTableUserValue;
  return { name: String(value ?? '') };
}

function toTag(value: unknown, index: number): Required<DataTableTagValue> {
  if (value && typeof value === 'object' && 'label' in value) {
    const tag = value as DataTableTagValue;
    return { label: tag.label, variant: tag.variant ?? TAG_VARIANTS[index % TAG_VARIANTS.length] };
  }
  return { label: String(value ?? ''), variant: TAG_VARIANTS[index % TAG_VARIANTS.length] };
}

function initialsOf(user: DataTableUserValue): string {
  return user.initials ?? user.name.slice(0, 2).toUpperCase();
}

/** Plain-text form of a value, used for copy and default links. */
function toText(fieldType: ResolvedFieldType, value: unknown): string {
  if (fieldType === 'range') {
    const [min, max] = toArray(value);
    return `${String(min ?? '')} — ${String(max ?? '')}`;
  }
  return toArray(value)
    .map((item) => {
      if (item && typeof item === 'object') {
        if ('name' in item) return String((item as DataTableUserValue).name);
        if ('label' in item) return String((item as DataTableTagValue).label);
      }
      return String(item ?? '');
    })
    .join(', ');
}

function runDefaultAction(action: DataTableCellAction, text: string) {
  switch (action) {
    case 'copy':
      void navigator.clipboard?.writeText(text);
      break;
    case 'open-external':
      window.open(text, '_blank', 'noopener,noreferrer');
      break;
    case 'email':
      window.location.href = `mailto:${text}`;
      break;
    case 'call':
      window.location.href = `tel:${text.replace(/[^\d+]/g, '')}`;
      break;
    default:
      break;
  }
}

interface OverflowListProps<T> {
  values: T[];
  renderItem: (value: T, index: number) => React.ReactNode;
  getKey: (value: T) => string;
  /** Plural noun used in the overflow trigger / popover labels. */
  itemNoun?: string;
  /** MenuCell props for each item in the "+N" overflow popover list. */
  toMenuCell: (value: T) => Partial<MenuCellProps>;
}

function OverflowList<T>({
  values,
  renderItem,
  getKey,
  itemNoun = 'tags',
  toMenuCell,
}: OverflowListProps<T>) {
  const popoverId = React.useId();
  const visibleRef = React.useRef<HTMLSpanElement>(null);
  const measureRef = React.useRef<HTMLSpanElement>(null);
  const overflowMeasureRef = React.useRef<HTMLSpanElement>(null);
  const overflowButtonRef = React.useRef<HTMLButtonElement>(null);

  const [visibleCount, setVisibleCount] = React.useState(values.length);
  const [expanded, setExpanded] = React.useState(false);

  const hiddenCount = Math.max(0, values.length - visibleCount);

  const recalculateVisibleCount = React.useCallback(() => {
    const visibleEl = visibleRef.current;
    const measureEl = measureRef.current;
    const overflowProbeEl = overflowMeasureRef.current;
    if (!visibleEl || !measureEl) {
      return;
    }

    const availableWidth = visibleEl.clientWidth;
    if (availableWidth <= 0) {
      return;
    }

    const widthNodes = Array.from(measureEl.querySelectorAll<HTMLElement>('[data-measure-tag]'));
    const tagWidths = widthNodes.map((node) => node.getBoundingClientRect().width);
    const gapPx = Number.parseFloat(window.getComputedStyle(visibleEl).columnGap || '0') || 0;
    const overflowWidth = overflowProbeEl?.getBoundingClientRect().width ?? 0;

    let used = 0;
    let fit = 0;

    for (let index = 0; index < tagWidths.length; index += 1) {
      const nextUsed = used + (fit > 0 ? gapPx : 0) + tagWidths[index];
      const remaining = tagWidths.length - (index + 1);
      const reserveForOverflow = remaining > 0 ? (fit >= 0 ? gapPx : 0) + overflowWidth : 0;

      if (nextUsed + reserveForOverflow <= availableWidth) {
        used = nextUsed;
        fit += 1;
      } else {
        break;
      }
    }

    // Always keep the first item visible; it truncates instead of collapsing to "+N" only.
    setVisibleCount(Math.max(fit, Math.min(1, tagWidths.length)));
  }, []);

  React.useEffect(() => {
    setVisibleCount(values.length);
  }, [values]);

  React.useEffect(() => {
    recalculateVisibleCount();
  }, [recalculateVisibleCount, values]);

  React.useEffect(() => {
    if (hiddenCount === 0 && expanded) {
      setExpanded(false);
    }
  }, [expanded, hiddenCount]);

  React.useEffect(() => {
    const visibleEl = visibleRef.current;
    if (!visibleEl || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => recalculateVisibleCount());
    observer.observe(visibleEl);
    return () => observer.disconnect();
  }, [recalculateVisibleCount]);

  React.useEffect(() => {
    if (!expanded) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (isPointerInsideAnchoredPopover(event, overflowButtonRef.current, popoverId)) {
        return;
      }

      setExpanded(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [expanded]);

  return (
    <>
      <span className="dsn-data-table-cell-tags" ref={visibleRef}>
        {values.slice(0, visibleCount).map((tagValue, index) => (
          <React.Fragment key={`${getKey(tagValue)}-${index}`}>{renderItem(tagValue, index)}</React.Fragment>
        ))}
        {hiddenCount > 0 && (
          <button
            ref={overflowButtonRef}
            type="button"
            className="dsn-data-table-cell-tags-overflow-trigger"
            aria-label={`Show ${hiddenCount} more ${itemNoun}`}
            aria-haspopup="dialog"
            aria-expanded={expanded}
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((previous) => !previous);
            }}
          >
            <Tag variant="neutral" label={`+${hiddenCount}`} showIcon={false} />
          </button>
        )}
      </span>

      <span className="dsn-data-table-cell-tags-measure" ref={measureRef} aria-hidden="true">
        {values.map((tagValue, index) => (
          <span key={`${getKey(tagValue)}-${index}`} data-measure-tag>
            {renderItem(tagValue, index)}
          </span>
        ))}
        <span ref={overflowMeasureRef}>
          <Tag variant="neutral" label={`+${values.length}`} showIcon={false} />
        </span>
      </span>

      {expanded && hiddenCount > 0 && (
        <div className="dsn-data-table-cell-tags-popover">
          <PopoverWrapper
            id={popoverId}
            anchorRef={overflowButtonRef}
            role="dialog"
            aria-label={`Hidden ${itemNoun}`}
            width={280}
            contentPadding="small"
            content={
              <div className="dsn-data-table-cell-tags-popover-content" role="list">
                {values.map((item, index) => (
                  <MenuCell
                    key={`${getKey(item)}-${index}`}
                    role="listitem"
                    tabIndex={-1}
                    fullWidth
                    showLeadingIcon={false}
                    showTrailingIcon={false}
                    {...toMenuCell(item)}
                  />
                ))}
              </div>
            }
          />
        </div>
      )}
    </>
  );
}

function PersonPill({ user }: { user: DataTableUserValue }) {
  return (
    <span className="dsn-data-table-cell-pill">
      <Avatar
        size="xxs"
        variant="profile"
        fill={user.src ? 'picture' : 'initials'}
        src={user.src}
        initials={initialsOf(user)}
        name={user.name}
      />
      <span className="dsn-data-table-cell-pill-label">{user.name}</span>
    </span>
  );
}

function personMenuCell(user: DataTableUserValue): Partial<MenuCellProps> {
  return {
    label: user.name,
    showAvatar: true,
    avatarProps: {
      size: 'xs',
      fill: user.src ? 'picture' : 'initials',
      src: user.src,
      initials: initialsOf(user),
      name: user.name,
    },
  };
}

function tagMenuCell(tag: Required<DataTableTagValue>): Partial<MenuCellProps> {
  return { showLabel: false, showTag: true, tagLabel: tag.label, tagVariant: tag.variant, 'aria-label': tag.label };
}

function renderTag(tag: Required<DataTableTagValue>, extra?: Partial<React.ComponentProps<typeof Tag>>) {
  return <Tag variant={tag.variant} label={tag.label} showLeadingIcon={false} showTrailingIcon={false} {...extra} />;
}

interface CellContentContext {
  fieldType: ResolvedFieldType;
  value: unknown;
  onCheckboxChange?: (checked: boolean) => void;
  onAction: (action: DataTableCellAction, event: React.MouseEvent<HTMLElement>) => void;
}

function renderCellContent({ fieldType, value, onCheckboxChange, onAction }: CellContentContext): React.ReactNode {
  switch (fieldType) {
    case 'main': {
      const user = toUser(value);
      return (
        <span className="dsn-data-table-cell-user">
          <Avatar
            size="xs"
            variant="profile"
            fill={user.src ? 'picture' : 'initials'}
            src={user.src}
            initials={initialsOf(user)}
            name={user.name}
          />
          <span className="dsn-data-table-cell-main-label">{user.name}</span>
        </span>
      );
    }
    case 'number':
      return <span>{typeof value === 'number' ? value.toLocaleString() : String(value ?? '')}</span>;
    case 'range':
    case 'multi-choice':
      return <span>{toText(fieldType, value)}</span>;
    case 'tags-multi':
      return (
        <OverflowList
          values={toArray(value).map(toTag)}
          getKey={(tag) => tag.label}
          renderItem={(tag) => renderTag(tag)}
          toMenuCell={tagMenuCell}
        />
      );
    case 'tags-readonly':
      return (
        <OverflowList
          values={toArray(value).map((item, index) => ({ ...toTag(item, index), variant: 'neutral' as TagVariant }))}
          getKey={(tag) => tag.label}
          renderItem={(tag) => renderTag(tag)}
          toMenuCell={tagMenuCell}
        />
      );
    case 'tags-single': {
      const [first] = toArray(value);
      if (first == null) return null;
      return renderTag(toTag(first, 0), { disclosure: true });
    }
    case 'single-user': {
      const user = toUser(value);
      return (
        <span className="dsn-data-table-cell-user">
          <Avatar
            size="xs"
            variant="profile"
            fill={user.src ? 'picture' : 'initials'}
            src={user.src}
            initials={initialsOf(user)}
            name={user.name}
          />
          <span>{user.name}</span>
        </span>
      );
    }
    case 'multi-user': {
      const users = toArray(value).map(toUser);
      return (
        <span className="dsn-data-table-cell-user">
          <AvatarGroup
            size="xs"
            maxVisible={3}
            avatars={users.map((user) => ({
              name: user.name,
              src: user.src,
              initials: initialsOf(user),
              fill: user.src ? 'picture' : 'initials',
            }))}
          />
          <span className="dsn-data-table-cell-truncate">{toText(fieldType, users)}</span>
        </span>
      );
    }
    case 'contact':
      return <PersonPill user={toUser(toArray(value)[0])} />;
    case 'contacts':
      return (
        <OverflowList
          values={toArray(value).map(toUser)}
          getKey={(user) => user.name}
          renderItem={(user) => <PersonPill user={user} />}
          itemNoun="contacts"
          toMenuCell={personMenuCell}
        />
      );
    case 'contacts-list':
      return (
        <span className="dsn-data-table-cell-stack">
          {toArray(value)
            .map(toUser)
            .map((user, index) => (
              <PersonPill key={`${user.name}-${index}`} user={user} />
            ))}
        </span>
      );
    case 'boolean':
      return (
        <Switcher
          size="sm"
          checked={Boolean(value)}
          disabled
          aria-label={Boolean(value) ? 'True value' : 'False value'}
        />
      );
    case 'buttons':
      return (
        <span className="dsn-data-table-cell-buttons">
          {(toArray(value) as DataTableButtonValue[]).map((button, index) => {
            const Icon = button.icon;
            return (
              <Button
                key={`${button.label}-${index}`}
                variant="secondary"
                size="sm"
                showLeadingIcon={Boolean(Icon)}
                leadingIcon={Icon ? <Icon size={16} aria-hidden="true" /> : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  button.onClick?.();
                }}
              >
                {button.label}
              </Button>
            );
          })}
        </span>
      );
    case 'checkbox':
      return (
        <Checkbox
          size="sm"
          checked={Boolean(value)}
          showContent={false}
          aria-label="Select row"
          onCheckedChange={onCheckboxChange}
        />
      );
    case 'expand': {
      const expanded = Boolean(value);
      return (
        <button
          type="button"
          className="dsn-data-table-cell-expand"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse row' : 'Expand row'}
          onClick={(event) => {
            event.stopPropagation();
            onAction('expand', event);
          }}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      );
    }
    case 'url':
    case 'url-readonly':
      return (
        <a className="dsn-data-table-cell-link" href={String(value ?? '#')}>
          {String(value ?? '')}
        </a>
      );
    case 'file':
      return (
        <span className="dsn-data-table-cell-file">
          <FileText size={16} aria-hidden="true" className="dsn-data-table-cell-file-icon" />
          <span className="dsn-data-table-cell-truncate">{toText(fieldType, value)}</span>
        </span>
      );
    case 'icon': {
      if (typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value && !React.isValidElement(value))) {
        const Icon = value as LucideIcon;
        return <Icon size={16} aria-hidden="true" />;
      }
      return React.isValidElement(value) ? value : <Diamond size={16} aria-hidden="true" />;
    }
    case 'empty':
      return <span className="dsn-data-table-cell-empty">{String(value ?? 'Add [field name]')}</span>;
    case 'string':
    case 'text':
    case 'long-text':
    case 'email':
    case 'phone':
    case 'address':
    case 'single-choice':
    case 'date':
    case 'datetime':
    case 'month-year':
    default:
      return <span>{String(value ?? '')}</span>;
  }
}

function renderHoverActions(
  actions: DataTableCellAction[],
  onAction: (action: DataTableCellAction, event: React.MouseEvent<HTMLElement>) => void,
): React.ReactNode {
  if (actions.length === 0) return null;

  const buttons = actions.map((action) => {
    const { icon: Icon, label } = ACTION_META[action];
    return (
      <Button
        key={action}
        variant="secondary"
        size="sm"
        showLabel={false}
        showLeadingIcon
        leadingIcon={<Icon size={16} aria-hidden="true" />}
        aria-label={label}
        onClick={(event) => {
          event.stopPropagation();
          onAction(action, event);
        }}
      />
    );
  });

  if (buttons.length === 1) return buttons[0];

  return (
    <ButtonGroup size="sm" spaceBetween={false} aria-label="Cell actions">
      {buttons}
    </ButtonGroup>
  );
}

/**
 * Typed table cell. `fieldType` maps 1:1 to the Figma "Field type" property.
 *
 * @aiVariant fieldType="main" — primary record column; hover offers open / side panel
 * @aiVariant fieldType="tags-multi" — status/category values as coloured tags with overflow
 * @aiVariant fieldType="single-user" — person/owner with avatar + name
 * @aiVariant fieldType="checkbox" — reserved for the row-selection column
 * @aiVariant fieldType="expand" — reserved for the row-expand column (32px)
 */
export function DataTableCell({
  fieldType = 'string',
  state = 'default',
  loading = false,
  value = 'Label',
  width,
  onCheckboxChange,
  onAction,
  revealActionsOnHover = false,
  leadingAccessory,
  align = 'left',
  className,
  'aria-label': ariaLabel,
  render,
  row,
}: DataTableCellProps) {
  const resolvedType = resolveFieldType(fieldType);
  const rootClass = ['dsn-data-table-cell', className].filter(Boolean).join(' ');
  const style = typeof width === 'number' ? ({ width: `${width}px` } as React.CSSProperties) : undefined;

  const handleAction = (action: DataTableCellAction, event: React.MouseEvent<HTMLElement>) => {
    onAction?.(action, value, event);
    if (!event.defaultPrevented) runDefaultAction(action, toText(resolvedType, value));
  };

  const showActions = !loading && (state === 'hover' || revealActionsOnHover);
  const hoverActions = showActions ? renderHoverActions(HOVER_ACTIONS[resolvedType], handleAction) : null;

  return (
    <div
      className={rootClass}
      data-field-type={resolvedType}
      data-state={state}
      data-loading={loading || undefined}
      data-align={align}
      data-reveal-actions={revealActionsOnHover || undefined}
      aria-label={ariaLabel}
      style={style}
    >
      {loading ? (
        <span className="dsn-data-table-cell-skeleton" aria-hidden="true" />
      ) : (
        <>
          {leadingAccessory && <span className="dsn-data-table-cell-leading-accessory">{leadingAccessory}</span>}
          <span className="dsn-data-table-cell-content">
            {render
              ? render(value, row ?? {})
              : renderCellContent({ fieldType: resolvedType, value, onCheckboxChange, onAction: handleAction })}
          </span>
          {hoverActions && <span className="dsn-data-table-cell-actions">{hoverActions}</span>}
        </>
      )}
    </div>
  );
}

export default DataTableCell;
