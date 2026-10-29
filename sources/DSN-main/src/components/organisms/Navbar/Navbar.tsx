import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../atoms/Button';
import {
  Breadcrumbs,
  type BreadcrumbItem,
  type BreadcrumbsProps,
} from '../../molecules/Breadcrumbs';
import './Navbar.css';

export type NavbarVariant = 'title' | 'breadcrumbs';

export interface NavbarProps {
  variant?: NavbarVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  showDescription?: boolean;
  descriptionIcon?: React.ReactNode;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
  breadcrumbMaxVisibleItems?: BreadcrumbsProps['maxVisibleItems'];
  breadcrumbShowEllipsis?: BreadcrumbsProps['showEllipsis'];
  responsiveCollapse?: boolean;
  backOnlyBreakpointPx?: number;
  backLabel?: string;
  onBackClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

const DEFAULT_BREADCRUMB_ITEMS: BreadcrumbItem[] = [
  { id: 'root', label: 'Title' },
  { id: 'group', label: '...' },
  { id: 'parent', label: 'Title' },
  { id: 'current', label: 'Title', variant: 'current' },
];

function resolveBackOnlyTitle(
  breadcrumbItems: BreadcrumbItem[],
  fallbackTitle: React.ReactNode,
): React.ReactNode {
  const currentItem = breadcrumbItems.find((item) => item.variant === 'current');
  if (currentItem?.label != null) return currentItem.label;
  const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
  if (lastItem?.label != null) return lastItem.label;
  return fallbackTitle;
}

/**
 * Page header bar for AppShell's header slot: page title or large breadcrumb trail plus action slots.
 *
 * @aiSelectWhen Rendering the header of any AppShell page
 * @aiSelectWhen Holding the page's primary CTA in rightActions
 *
 * @aiAvoid Do not use as a section title in page content — use SectionHeader instead
 * @aiAvoid Do not use for in-content hierarchy — use Breadcrumbs size="sm" instead
 * @aiAvoid Do not use as a Card, Modal or Drawer header — use that component's header props instead
 *
 * @aiVariant variant="title" — top-level and list pages; never a back arrow
 * @aiVariant variant="breadcrumbs" — detail views; the trail is the title, never show both
 *
 * @aiSpatial Owns its padding and spans the AppShell header region; never add inline padding.
 *
 * @aiCompose Always use inside AppShell header — always set variant explicitly
 * @aiCompose rightActions order Ghost → Secondary → Primary; one Primary, always rightmost
 * @aiCompose Never combine with an in-page back button on detail views
 */
export function Navbar({
  variant = 'title',
  title = 'Title',
  description,
  showDescription = false,
  descriptionIcon,
  leftActions,
  rightActions,
  breadcrumbItems = DEFAULT_BREADCRUMB_ITEMS,
  breadcrumbMaxVisibleItems = 4,
  breadcrumbShowEllipsis = true,
  responsiveCollapse = true,
  backOnlyBreakpointPx = 640,
  backLabel = 'Back',
  onBackClick,
  className,
  'aria-label': ariaLabel = 'Navbar',
}: NavbarProps) {
  const getViewportWidth = React.useCallback(
    () => (typeof window !== 'undefined' ? window.innerWidth : Number.POSITIVE_INFINITY),
    [],
  );
  const [viewportWidth, setViewportWidth] = React.useState<number>(getViewportWidth);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isBackOnly = variant === 'breadcrumbs' && responsiveCollapse && viewportWidth <= backOnlyBreakpointPx;
  const computedMaxVisibleItems = React.useMemo(() => {
    if (!responsiveCollapse || variant !== 'breadcrumbs') return breadcrumbMaxVisibleItems;
    if (viewportWidth <= backOnlyBreakpointPx) return 1;
    if (viewportWidth <= 768) return Math.min(breadcrumbMaxVisibleItems, 3);
    if (viewportWidth <= 1024) return Math.min(breadcrumbMaxVisibleItems, 4);
    return Math.min(breadcrumbMaxVisibleItems, 5);
  }, [backOnlyBreakpointPx, breadcrumbMaxVisibleItems, responsiveCollapse, variant, viewportWidth]);

  const rootClass = ['dsn-navbar', className].filter(Boolean).join(' ');
  const resolvedLeftActions = leftActions ?? null;
  const backOnlyTitle = resolveBackOnlyTitle(breadcrumbItems, title);

  return (
    <header
      className={rootClass}
      data-variant={variant}
      data-back-only={isBackOnly || undefined}
      aria-label={ariaLabel}
    >
      <div className="dsn-navbar-left">
        {isBackOnly ? (
          <Button
            variant="ghost"
            size="md"
            showLeadingIcon
            leadingIcon={<ArrowLeft size={16} aria-hidden="true" />}
            showLabel={false}
            aria-label={backLabel}
            onClick={onBackClick}
          />
        ) : (
          resolvedLeftActions
        )}
      </div>

      <div className="dsn-navbar-center">
        {variant === 'breadcrumbs' ? (
          isBackOnly ? (
            <div className="dsn-navbar-title-row">
              <h1 className="dsn-navbar-title">{backOnlyTitle}</h1>
            </div>
          ) : (
            <Breadcrumbs
              size="lg"
              items={breadcrumbItems}
              maxVisibleItems={computedMaxVisibleItems}
              showEllipsis={breadcrumbShowEllipsis}
              aria-label="Page breadcrumb"
            />
          )
        ) : (
          <div className="dsn-navbar-title-stack">
            <div className="dsn-navbar-title-row">
              <h1 className="dsn-navbar-title">{title}</h1>
            </div>
            {showDescription && description ? (
              <div className="dsn-navbar-description-row">
                {descriptionIcon ? (
                  <span className="dsn-navbar-description-icon" aria-hidden="true">
                    {descriptionIcon}
                  </span>
                ) : null}
                <p className="dsn-navbar-description">{description}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="dsn-navbar-right">{rightActions}</div>
    </header>
  );
}

export default Navbar;
