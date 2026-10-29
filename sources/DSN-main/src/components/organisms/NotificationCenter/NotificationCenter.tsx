import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Bell, Inbox, CheckCheck } from 'lucide-react';
import { Avatar, type AvatarProps } from '../../atoms/Avatar';
import { Badge } from '../../atoms/Badge';
import { Button } from '../../atoms/Button';
import { SegmentControl } from '../../atoms/SegmentControl';
import { SkeletonLoading } from '../../atoms/SkeletonLoading';
import { EmptyState } from '../../molecules/EmptyState';
import {
  PopoverWrapper,
  focusWithoutScroll,
  isPointerInsideAnchoredPopover,
} from '../../molecules/PopoverWrapper';
import './NotificationCenter.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationFilter = 'all' | 'unread';

export interface NotificationItem {
  /** Stable identifier — used as the React key and returned in callbacks. */
  id: string;
  /** One-line summary of the event, e.g. "Ana Silva commented on Q3 roadmap". */
  title: string;
  /** Optional supporting text. Clamped to two lines. */
  description?: string;
  /** Preformatted time shown to the user, e.g. "5 min ago". The app owns formatting and locale. */
  timeLabel: string;
  /** Machine-readable ISO timestamp for the `<time dateTime>` attribute. */
  dateTime?: string;
  /** Read state. Owned by the app — the component never mutates it. Default `false`. */
  read?: boolean;
  /**
   * Leading avatar. Use `src`/`initials` + `name` for a person; `fill="icon"` + a Lucide
   * `icon` for system events. Omit to render a neutral bell icon avatar.
   */
  avatar?: Pick<AvatarProps, 'src' | 'initials' | 'name' | 'icon' | 'fill' | 'variant'>;
}

export interface NotificationCenterProps {
  /** Notifications to list, newest first. */
  notifications: NotificationItem[];
  /** Controlled open state of the panel. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called whenever the panel requests to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Controlled list filter. */
  filter?: NotificationFilter;
  /** Initial list filter when uncontrolled. @default 'all' */
  defaultFilter?: NotificationFilter;
  /** Called when the user switches between All and Unread. */
  onFilterChange?: (filter: NotificationFilter) => void;
  /** Show the All / Unread segment control. @default true */
  showFilter?: boolean;
  /** Called when a notification row is activated. The panel closes and focus returns to the trigger. */
  onNotificationClick?: (item: NotificationItem) => void;
  /** Called by "Mark all as read". The action is hidden when omitted. */
  onMarkAllRead?: () => void;
  /**
   * Called by "View all notifications" in the bottom bar — navigate to the app's full
   * notifications page here. The panel closes and focus returns to the trigger.
   * The bar is hidden when omitted.
   */
  onViewAll?: () => void;
  /**
   * Open the panel from your own trigger (e.g. a Sidebar item's `buttonRef`) instead of
   * the built-in bell. When set, no bell is rendered: control `open` / `onOpenChange`
   * from the trigger and give it `aria-haspopup="dialog"`, `aria-expanded` and
   * `aria-controls={id}`. Focus returns to this element on close.
   */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Panel id — pass the same value to an external trigger's `aria-controls`. */
  id?: string;
  /**
   * Where the panel opens relative to its trigger.
   * Defaults to `bottom` for the bell and `right` with an external `anchorRef`.
   */
  placement?: 'bottom' | 'right';
  /** Show skeleton rows while notifications load. @default false */
  loading?: boolean;
  /** Additional CSS class names for the root element. */
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function triggerLabel(unreadCount: number): string {
  if (unreadCount === 0) return 'Notifications';
  return `Notifications, ${unreadCount} unread`;
}

function announcement(newCount: number): string {
  return newCount === 1 ? '1 new notification' : `${newCount} new notifications`;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * **NotificationCenter** — bell trigger with an unread count that opens an anchored
 * panel listing the user's notifications.
 *
 * Data-driven and stateless about read state: the app passes `notifications` and
 * updates `read` in response to `onNotificationClick` / `onMarkAllRead`.
 *
 * @aiSelectWhen The app needs a persistent inbox of events the user can review later (mentions, assignments, approvals)
 * @aiSelectWhen A Navbar needs a bell with an unread count
 *
 * @aiAvoid Do not use to confirm the outcome of an action the user just took — use Toast instead
 * @aiAvoid Do not use for a page-level notice about the current view — use Callout instead
 * @aiAvoid Do not use for decisions that block the user — use Modal or AlertDialog instead
 *
 * @aiSpatial Renders only the trigger in place; the panel portals to document.body and owns its own padding
 *
 * @aiCompose Place in Navbar rightActions, to the left of the primary CTA — or open it from a
 *   Sidebar item via `anchorRef` (item `buttonRef`) when Notifications lives in the Sidebar
 * @aiCompose Never wrap in PopoverMenu or another popover — it owns its own anchored panel
 */
export function NotificationCenter({
  notifications,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  filter: filterProp,
  defaultFilter = 'all',
  onFilterChange,
  showFilter = true,
  onNotificationClick,
  onMarkAllRead,
  onViewAll,
  anchorRef: externalAnchorRef,
  id,
  placement,
  loading = false,
  className,
}: NotificationCenterProps) {
  const baseId = useId();
  const panelId = id ?? `${baseId}-panel`;
  const titleId = `${baseId}-title`;

  const rootRef = useRef<HTMLDivElement>(null);
  const bellAnchorRef = useRef<HTMLSpanElement>(null);
  const hasExternalTrigger = externalAnchorRef !== undefined;
  const anchorRef = externalAnchorRef ?? bellAnchorRef;
  const resolvedPlacement = placement ?? (hasExternalTrigger ? 'right' : 'bottom');

  const [openState, setOpenState] = useState(defaultOpen);
  const isOpen = openProp ?? openState;
  const [filterState, setFilterState] = useState<NotificationFilter>(defaultFilter);
  const filter = filterProp ?? filterState;
  const [activeIndex, setActiveIndex] = useState(0);
  // The panel's anchor (rootRef) is only attached after the first commit, so an
  // initially-open panel waits one effect before mounting to measure correctly.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );
  const visible = useMemo(
    () => (filter === 'unread' ? notifications.filter((item) => !item.read) : notifications),
    [filter, notifications],
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChange?.(next);
    },
    [onOpenChange, openProp],
  );

  const getItems = useCallback(
    () =>
      Array.from(
        document
          .getElementById(panelId)
          ?.querySelectorAll<HTMLButtonElement>('.dsn-notification-center-item') ?? [],
      ),
    [panelId],
  );

  const focusTrigger = useCallback(() => {
    const trigger = hasExternalTrigger
      ? externalAnchorRef?.current
      : rootRef.current?.querySelector<HTMLButtonElement>('.dsn-notification-center-trigger');
    trigger?.focus();
  }, [externalAnchorRef, hasExternalTrigger]);

  const close = useCallback(
    (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) focusTrigger();
    },
    [focusTrigger, setOpen],
  );

  // ── Unread announcements (skip first mount) ──────────────────────────────
  const previousUnread = useRef(unreadCount);
  const [liveMessage, setLiveMessage] = useState('');
  useEffect(() => {
    const delta = unreadCount - previousUnread.current;
    previousUnread.current = unreadCount;
    if (delta > 0) setLiveMessage(announcement(delta));
  }, [unreadCount]);

  // ── Dismiss: outside click (portal-safe) + Escape ────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      // An external trigger toggles itself on click — treat it as inside so
      // mousedown does not close the panel right before the click reopens it.
      const triggerRoot = hasExternalTrigger
        ? (externalAnchorRef?.current ?? null)
        : rootRef.current;
      if (!isPointerInsideAnchoredPopover(event, triggerRoot, panelId)) {
        close(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close(true);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [close, externalAnchorRef, hasExternalTrigger, isOpen, panelId]);

  // ── Initial focus on open ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !mounted) return;
    setActiveIndex(0);
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const focusInitial = () => {
      const firstItem = getItems()[0];
      focusWithoutScroll(
        firstItem ??
          panel.querySelector<HTMLElement>('button:not(:disabled), [tabindex="0"]') ??
          panel,
      );
    };

    // The anchored panel stays visibility:hidden (unfocusable) until PopoverWrapper
    // has measured it and set data-placement. Observe that instead of waiting on
    // animation frames, which browsers pause in hidden tabs and panes.
    if (panel.hasAttribute('data-placement')) {
      focusInitial();
      return;
    }
    const observer = new MutationObserver(() => {
      if (panel.hasAttribute('data-placement')) {
        observer.disconnect();
        focusInitial();
      }
    });
    observer.observe(panel, { attributes: true, attributeFilter: ['data-placement'] });
    return () => observer.disconnect();
    // Only on open — filter changes keep focus on the segment control.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted]);

  // Keep the roving index inside the visible list when it shrinks.
  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(visible.length - 1, 0)));
  }, [visible.length]);

  const moveFocus = (index: number) => {
    setActiveIndex(index);
    focusWithoutScroll(getItems()[index]);
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const last = visible.length - 1;
    if (last < 0) return;
    const current = getItems().findIndex((el) => el === document.activeElement);
    const from = current >= 0 ? current : activeIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(from >= last ? 0 : from + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(from <= 0 ? last : from - 1);
        break;
      case 'Home':
        event.preventDefault();
        moveFocus(0);
        break;
      case 'End':
        event.preventDefault();
        moveFocus(last);
        break;
      default:
        break;
    }
  };

  const handleFilterChange = (value: string) => {
    const next = value as NotificationFilter;
    if (filterProp === undefined) setFilterState(next);
    onFilterChange?.(next);
  };

  const handleViewAll = () => {
    onViewAll?.();
    close(true);
  };

  const handleItemClick = (item: NotificationItem) => {
    onNotificationClick?.(item);
    close(true);
  };

  // ── Slots ────────────────────────────────────────────────────────────────
  const header = (
    <div className="dsn-notification-center-header">
      <h2 id={titleId} className="dsn-notification-center-title">
        Notifications
      </h2>
      {onMarkAllRead && (
        <Button
          variant="ghost"
          size="sm"
          showLeadingIcon
          leadingIcon={<CheckCheck size={16} />}
          disabled={unreadCount === 0}
          onClick={onMarkAllRead}
        >
          Mark all as read
        </Button>
      )}
    </div>
  );

  const segment = showFilter ? (
    <div className="dsn-notification-center-filter">
      <SegmentControl
        aria-label="Filter notifications"
        fullWidth
        value={filter}
        onChange={handleFilterChange}
        options={[
          { value: 'all', label: 'All' },
          {
            value: 'unread',
            label: 'Unread',
            // The trailing slot is aria-hidden, so the count is restated in the label.
            showTrailingIcon: unreadCount > 0,
            trailingIcon: <Badge size="sm" variant="highlight-strong" count={unreadCount} />,
            'aria-label': unreadCount > 0 ? `Unread, ${unreadCount}` : 'Unread',
          },
        ]}
      />
    </div>
  ) : undefined;

  let content: React.ReactNode;
  if (loading) {
    content = (
      <ul
        className="dsn-notification-center-list"
        aria-busy="true"
        aria-label="Loading notifications"
      >
        {[0, 1, 2].map((row) => (
          <li key={row} className="dsn-notification-center-skeleton">
            <SkeletonLoading type="avatar" />
            <div className="dsn-notification-center-skeleton-text">
              <SkeletonLoading type="pill" />
              <SkeletonLoading type="pill" />
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (visible.length === 0) {
    const caughtUp = filter === 'unread' && notifications.length > 0;
    content = (
      <div className="dsn-notification-center-empty">
        <EmptyState
          size="small"
          hasIcon
          icon={caughtUp ? CheckCheck : Inbox}
          title={caughtUp ? "You're all caught up" : 'No notifications yet'}
          subtitle={
            caughtUp
              ? 'New notifications will appear here.'
              : 'Updates about your work will appear here.'
          }
          hasActions={false}
          showHelpText={false}
        />
      </div>
    );
  } else {
    content = (
      <ul
        className="dsn-notification-center-list"
        aria-labelledby={titleId}
        onKeyDown={handleListKeyDown}
      >
        {visible.map((item, index) => {
          const unread = !item.read;
          const avatar = item.avatar ?? { fill: 'icon' as const, icon: Bell };
          return (
            <li key={item.id} className="dsn-notification-center-list-item">
              <button
                type="button"
                className="dsn-notification-center-item"
                data-unread={unread || undefined}
                tabIndex={index === activeIndex ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onClick={() => handleItemClick(item)}
              >
                <span className="dsn-notification-center-item-avatar" aria-hidden="true">
                  <Avatar size="sm" {...avatar} />
                </span>
                <span className="dsn-notification-center-item-text">
                  <span className="dsn-notification-center-item-title">{item.title}</span>
                  {item.description && (
                    <span className="dsn-notification-center-item-description">
                      {item.description}
                    </span>
                  )}
                  <time className="dsn-notification-center-item-time" dateTime={item.dateTime}>
                    {item.timeLabel}
                  </time>
                </span>
                {unread && (
                  <span className="dsn-notification-center-item-indicator">
                    <Badge size="dot" variant="highlight-strong" />
                    <span className="dsn-notification-center-visually-hidden">Unread</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  const bottomBar = onViewAll ? (
    <div className="dsn-notification-center-footer">
      <Button variant="ghost" size="md" onClick={handleViewAll}>
        View all notifications
      </Button>
    </div>
  ) : undefined;

  const rootClass = ['dsn-notification-center', className].filter(Boolean).join(' ');

  return (
    <div ref={rootRef} className={rootClass}>
      {!hasExternalTrigger && (
        <span ref={bellAnchorRef} className="dsn-notification-center-anchor">
          <Button
            variant="ghost"
            size="md"
            showLabel={false}
            showLeadingIcon
            leadingIcon={<Bell size={16} />}
            className="dsn-notification-center-trigger"
            aria-label={triggerLabel(unreadCount)}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={isOpen ? panelId : undefined}
            onClick={() => setOpen(!isOpen)}
          />
          {unreadCount > 0 && (
            <span className="dsn-notification-center-count" aria-hidden="true">
              <Badge size="sm" variant="critical" count={unreadCount} />
            </span>
          )}
        </span>
      )}

      <span className="dsn-notification-center-visually-hidden" aria-live="polite" role="status">
        {liveMessage}
      </span>

      {isOpen && mounted && (
        <PopoverWrapper
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          anchorRef={anchorRef}
          preferredPlacement={resolvedPlacement}
          width="var(--popover-width-lg)"
          className="dsn-notification-center-panel"
          contentClassName="dsn-notification-center-content"
          header={header}
          segment={segment}
          content={content}
          bottomBar={bottomBar}
        />
      )}
    </div>
  );
}

export default NotificationCenter;
