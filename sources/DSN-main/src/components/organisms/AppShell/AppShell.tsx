import React from 'react';
import './AppShell.css';

const DEFAULT_SIDEBAR_WIDTH = 200;
const DEFAULT_MIN_SIDEBAR_WIDTH = 128;
const DEFAULT_MAX_SIDEBAR_WIDTH = 320;
const DEFAULT_COLLAPSED_SIDEBAR_WIDTH = 48;
const DEFAULT_KEYBOARD_RESIZE_STEP = 16;
const DEFAULT_CLICK_EXPAND_WIDTH = 256;

function clampWidth(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeClientX(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return value;
}

export interface AppShellProps {
  header?: React.ReactNode;
  /** Optional content rendered inside the AppShell body, after `header` and
   * before the scrollable main area. */
  bodyHeader?: React.ReactNode;
  sidebar?: React.ReactNode;
  rightPanel?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarWidth?: number;
  sidebarCollapsed?: boolean;
  minSidebarWidth?: number;
  maxSidebarWidth?: number;
  collapsedSidebarWidth?: number;
  defaultSidebarWidth?: number;
  sidebarResizeStep?: number;
  onSidebarWidthChange?: (nextWidth: number) => void;
  onSidebarCollapsedChange?: (nextCollapsed: boolean) => void;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

/**
 * Mandatory root layout: resizable sidebar column, fixed header region and scroll-isolated main content.
 *
 * @aiSelectWhen Building any page — AppShell is the only permitted root layout
 * @aiSelectWhen Full-width sticky UI must stay flush under the navbar — pass it as bodyHeader
 *
 * @aiAvoid Do not build root layout with raw divs — use AppShell instead
 * @aiAvoid Do not use rightPanel for transient detail content — use Drawer instead
 * @aiAvoid Do not nest inside Modal, Drawer or another AppShell — use Drawer or Modal for secondary surfaces
 *
 * @aiSpatial Main area owns its padding and is the only scroll container; parent must be a full-viewport flex wrapper and AppShell itself is never sized.
 *
 * @aiCompose Always place inside <div style={{ height: '100vh', display: 'flex' }}>
 * @aiCompose header takes Navbar only; sidebar takes Sidebar only — never pass collapsed to Sidebar
 * @aiCompose Never add a padding wrapper inside children
 */
export function AppShell({
  header,
  bodyHeader,
  sidebar,
  rightPanel,
  footer,
  sidebarWidth,
  sidebarCollapsed,
  minSidebarWidth = DEFAULT_MIN_SIDEBAR_WIDTH,
  maxSidebarWidth = DEFAULT_MAX_SIDEBAR_WIDTH,
  collapsedSidebarWidth = DEFAULT_COLLAPSED_SIDEBAR_WIDTH,
  defaultSidebarWidth = DEFAULT_SIDEBAR_WIDTH,
  sidebarResizeStep = DEFAULT_KEYBOARD_RESIZE_STEP,
  onSidebarWidthChange,
  onSidebarCollapsedChange,
  children,
  className,
  'aria-label': ariaLabel = 'Application shell',
}: AppShellProps) {
  const sidebarContainerRef = React.useRef<HTMLDivElement | null>(null);
  const isSidebarWidthControlled = typeof sidebarWidth === 'number';
  const isSidebarCollapsedControlled = typeof sidebarCollapsed === 'boolean';
  const [uncontrolledSidebarWidth, setUncontrolledSidebarWidth] = React.useState(defaultSidebarWidth);
  const [uncontrolledSidebarCollapsed, setUncontrolledSidebarCollapsed] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [isEdgeHot, setIsEdgeHot] = React.useState(false);
  const suppressNextClickRef = React.useRef(false);
  const dragStateRef = React.useRef<{
    startX: number;
    startWidth: number;
    startedCollapsed: boolean;
    hasDragged: boolean;
  } | null>(null);

  const resolvedSidebarCollapsed = isSidebarCollapsedControlled ? sidebarCollapsed : uncontrolledSidebarCollapsed;
  const resolvedSidebarWidth = isSidebarWidthControlled ? sidebarWidth : uncontrolledSidebarWidth;
  const clampedExpandedWidth = clampWidth(
    resolvedSidebarWidth ?? DEFAULT_SIDEBAR_WIDTH,
    minSidebarWidth,
    maxSidebarWidth,
  );
  const expandedFallbackWidth = clampWidth(defaultSidebarWidth, minSidebarWidth, maxSidebarWidth);
  const effectiveSidebarWidth = resolvedSidebarCollapsed ? collapsedSidebarWidth : clampedExpandedWidth;

  const setSidebarCollapsedState = React.useCallback((nextCollapsed: boolean) => {
    if (!isSidebarCollapsedControlled) {
      setUncontrolledSidebarCollapsed(nextCollapsed);
    }
    onSidebarCollapsedChange?.(nextCollapsed);
  }, [isSidebarCollapsedControlled, onSidebarCollapsedChange]);

  const setSidebarWidthState = React.useCallback((nextWidth: number) => {
    const clampedWidth = clampWidth(nextWidth, minSidebarWidth, maxSidebarWidth);
    if (!isSidebarWidthControlled) {
      setUncontrolledSidebarWidth(clampedWidth);
    }
    onSidebarWidthChange?.(clampedWidth);
  }, [isSidebarWidthControlled, maxSidebarWidth, minSidebarWidth, onSidebarWidthChange]);

  const focusSidebarSearchInput = React.useCallback(() => {
    const container = sidebarContainerRef.current;
    if (!container) return;
    const searchInput = container.querySelector<HTMLInputElement>(
      'input[type="search"], .dsn-search-bar-field, input[aria-label*="search" i], input[placeholder*="search" i]',
    );
    searchInput?.focus();
  }, []);

  const openSidebarSearch = React.useCallback(() => {
    setSidebarCollapsedState(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        focusSidebarSearchInput();
      });
    });
  }, [focusSidebarSearchInput, setSidebarCollapsedState]);

  const endResize = React.useCallback(() => {
    dragStateRef.current = null;
    setIsResizing(false);
    setIsEdgeHot(false);
  }, []);

  const handleGlobalPointerMove = React.useCallback(
    (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const currentClientX = normalizeClientX(event.clientX, dragState.startX);
      const deltaX = currentClientX - dragState.startX;
      if (Math.abs(deltaX) > 2) {
        dragState.hasDragged = true;
      }

      const proposedWidth = dragState.startWidth + deltaX;
      const nextWidth = clampWidth(proposedWidth, minSidebarWidth, maxSidebarWidth);

      if (proposedWidth < minSidebarWidth && !dragState.startedCollapsed) {
        setSidebarCollapsedState(true);
        return;
      }

      setSidebarCollapsedState(false);
      setSidebarWidthState(nextWidth);
    },
    [maxSidebarWidth, minSidebarWidth, setSidebarCollapsedState, setSidebarWidthState],
  );

  const handleGlobalPointerUp = React.useCallback(() => {
    const dragState = dragStateRef.current;
    if (dragState?.hasDragged) {
      suppressNextClickRef.current = true;
    }
    window.removeEventListener('pointermove', handleGlobalPointerMove);
    endResize();
  }, [endResize, handleGlobalPointerMove]);

  React.useEffect(
    () => () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    },
    [handleGlobalPointerMove, handleGlobalPointerUp],
  );

  const handleResizePointerDown: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    const startedCollapsed = resolvedSidebarCollapsed;
    const startWidth = startedCollapsed ? minSidebarWidth : clampedExpandedWidth;

    dragStateRef.current = {
      startX: normalizeClientX(event.clientX, 0),
      startWidth,
      startedCollapsed,
      hasDragged: false,
    };
    setIsResizing(true);
    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp, { once: true });
  };

  const updateEdgeHotState = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (isResizing) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      setIsEdgeHot(Math.abs(event.clientX - centerX) <= 2);
    },
    [isResizing],
  );

  const handleToggleClick = React.useCallback(() => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    const nextCollapsed = !resolvedSidebarCollapsed;
    setSidebarCollapsedState(nextCollapsed);

    if (!nextCollapsed) {
      const nextExpandedWidth = resolvedSidebarCollapsed
        ? DEFAULT_CLICK_EXPAND_WIDTH
        : (resolvedSidebarWidth ?? expandedFallbackWidth);
      setSidebarWidthState(clampWidth(nextExpandedWidth, minSidebarWidth, maxSidebarWidth));
    }
  }, [
    expandedFallbackWidth,
    maxSidebarWidth,
    minSidebarWidth,
    resolvedSidebarCollapsed,
    resolvedSidebarWidth,
    setSidebarCollapsedState,
    setSidebarWidthState,
  ]);

  const handleResizeKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleClick();
      return;
    }

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();

    if (event.key === 'ArrowRight' && resolvedSidebarCollapsed) {
      setSidebarCollapsedState(false);
      setSidebarWidthState(clampWidth(minSidebarWidth + sidebarResizeStep, minSidebarWidth, maxSidebarWidth));
      return;
    }

    if (event.key === 'ArrowLeft' && resolvedSidebarCollapsed) return;

    const nextWidth =
      event.key === 'ArrowRight'
        ? clampWidth(clampedExpandedWidth + sidebarResizeStep, minSidebarWidth, maxSidebarWidth)
        : clampedExpandedWidth - sidebarResizeStep;

    if (nextWidth < minSidebarWidth) {
      setSidebarCollapsedState(true);
      return;
    }

    setSidebarCollapsedState(false);
    setSidebarWidthState(clampWidth(nextWidth, minSidebarWidth, maxSidebarWidth));
  };

  const resolvedSidebar = React.useMemo(() => {
    if (!React.isValidElement(sidebar)) return sidebar;
    if (typeof sidebar.type === 'string') return sidebar;
    return React.cloneElement(sidebar, {
      collapsed: resolvedSidebarCollapsed,
      onCollapsedSearchActivate: openSidebarSearch,
    } as {
      collapsed: boolean;
      onCollapsedSearchActivate: () => void;
    });
  }, [openSidebarSearch, resolvedSidebarCollapsed, sidebar]);

  const handleSidebarClickCapture: React.MouseEventHandler<HTMLElement> = (event) => {
    if (!resolvedSidebarCollapsed) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.dsn-sidebar-collapsed-search-trigger')) {
      openSidebarSearch();
    }
  };

  const rootClass = ['dsn-app-shell', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-sidebar-collapsed={resolvedSidebarCollapsed || undefined}
      data-sidebar-resizing={isResizing || undefined}
      aria-label={ariaLabel}
    >
      <a href="#dsn-main-content" className="dsn-app-shell-skip-link">
        Skip to main content
      </a>
      {resolvedSidebar ? (
        <div className="dsn-app-shell-sidebar-column" style={{ width: `${effectiveSidebarWidth}px` }}>
          <div
            ref={sidebarContainerRef}
            className="dsn-app-shell-sidebar"
            onClickCapture={handleSidebarClickCapture}
          >
            {resolvedSidebar}
          </div>
          <button
            type="button"
            className="dsn-app-shell-sidebar-resize-handle"
            data-resizing={isResizing || undefined}
            data-edge-hot={(isEdgeHot || isResizing) || undefined}
            aria-label={resolvedSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!resolvedSidebarCollapsed}
            onPointerDown={handleResizePointerDown}
            onPointerEnter={updateEdgeHotState}
            onPointerMove={updateEdgeHotState}
            onPointerLeave={() => setIsEdgeHot(false)}
            onClick={handleToggleClick}
            onKeyDown={handleResizeKeyDown}
          />
        </div>
      ) : null}

      <div className="dsn-app-shell-body">
        {header ? <div className="dsn-app-shell-header">{header}</div> : null}
        {bodyHeader ? <div className="dsn-app-shell-body-header">{bodyHeader}</div> : null}

        <div className="dsn-app-shell-content-row">
          <main id="dsn-main-content" className="dsn-app-shell-main" aria-label="Page content">
            {children}
          </main>

          {rightPanel ? (
            <aside className="dsn-app-shell-right-panel" aria-label="Secondary content">
              {rightPanel}
            </aside>
          ) : null}
        </div>

        {footer ? <footer className="dsn-app-shell-footer">{footer}</footer> : null}
      </div>
    </div>
  );
}

export default AppShell;
