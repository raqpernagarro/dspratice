import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Search } from 'lucide-react';
import type { AvatarProps } from '../../atoms/Avatar';
import type { BadgeVariant } from '../../atoms/Badge';
import { Button } from '../../atoms/Button';
import { Separator } from '../../atoms/Separator';
import { SectionHeader } from '../../atoms/SectionHeader';
import {
  SidebarMenuSelector,
  type SidebarMenuSelectorProps,
} from '../../molecules/SidebarMenuSelector';
import './Sidebar.css';

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  showAvatar?: boolean;
  avatarProps?: AvatarProps;
  showBadge?: boolean;
  badgeCount?: number;
  badgeVariant?: BadgeVariant;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** Ref to the item's button — pass as `anchorRef` to a panel the item opens (e.g. NotificationCenter). */
  buttonRef?: React.Ref<HTMLButtonElement>;
  /** Set when the item opens a popup panel instead of navigating. */
  'aria-haspopup'?: 'dialog' | 'menu' | 'listbox';
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
}

export interface SidebarSection {
  id: string;
  title?: string;
  showDisclosure?: boolean;
  trailingAction?: React.ReactNode;
  items: SidebarMenuItem[];
  separator?: 'before' | 'after' | 'both';
}

export interface SidebarAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export interface SidebarProps {
  collapsed?: boolean;
  selector?: React.ReactNode;
  selectorProps?: SidebarMenuSelectorProps;
  /** Primary sidebar actions (e.g. New chat) — rendered as full-width secondary buttons. */
  actions?: SidebarAction[];
  showSearch?: boolean;
  searchSlot?: React.ReactNode;
  onCollapsedSearchActivate?: () => void;
  sections: SidebarSection[];
  bottomContent?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

/**
 * Primary navigation rail for AppShell's sidebar slot: workspace selector, search, sectioned items and bottom-pinned content.
 *
 * @aiSelectWhen The app has primary cross-page navigation inside AppShell
 * @aiSelectWhen A nav item opens a panel such as NotificationCenter — set buttonRef and aria-haspopup on the item
 *
 * @aiAvoid Do not use for in-page sub-navigation — use TabNav instead
 * @aiAvoid Do not use as a menu of actions — use PopoverMenu instead
 * @aiAvoid Do not hand-build rows — use SidebarMenuSelector for bottomContent
 *
 * @aiSpatial Owns its insets and fills the AppShell sidebar column; AppShell owns width, resize and collapse.
 *
 * @aiCompose Always use inside AppShell sidebar (or a left Drawer on mobile) — never pass collapsed manually
 * @aiCompose Order: selectorProps → showSearch/searchSlot → sections → bottomContent (Settings + User Name)
 * @aiCompose Never invent nav items or sections — shape the ones the task names with the spec's section recipes (Primary → Pinned → Groups → Recent); keep the parent item selected on list and detail routes
 */
export function Sidebar({
  collapsed = false,
  selector,
  selectorProps,
  actions,
  showSearch = false,
  searchSlot,
  onCollapsedSearchActivate,
  sections,
  bottomContent,
  className,
  'aria-label': ariaLabel = 'Sidebar',
}: SidebarProps) {
  const sidebarId = React.useId();
  const [expandedBySection, setExpandedBySection] = React.useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        sections.map((section) => [section.id, true]),
      ),
  );

  React.useEffect(() => {
    setExpandedBySection((prev) => {
      const next: Record<string, boolean> = {};
      for (const section of sections) {
        next[section.id] = prev[section.id] ?? true;
      }
      return next;
    });
  }, [sections]);

  const rootClass = ['dsn-sidebar', className].filter(Boolean).join(' ');

  const resolvedSelector = selector ?? (
    <SidebarMenuSelector
      variant={collapsed ? 'icon' : 'full'}
      label="Workspace"
      showAvatar
      avatarProps={{ size: 'xs', variant: 'organization', fill: 'initials', initials: 'WS', name: 'Workspace' }}
      showDisclosure={!collapsed}
      {...selectorProps}
    />
  );

  return (
    <aside
      className={rootClass}
      data-collapsed={collapsed || undefined}
      aria-label={ariaLabel}
    >
      <div className="dsn-sidebar-header">
        <div className="dsn-sidebar-selector-row">
          <div className="dsn-sidebar-selector-slot">{resolvedSelector}</div>
        </div>

        {showSearch && searchSlot && (
          <div className="dsn-sidebar-search">{searchSlot}</div>
        )}

        {actions && actions.length > 0 ? (
          <div className="dsn-sidebar-actions">
            {actions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant="secondary"
                size="md"
                className="dsn-sidebar-action-button"
                disabled={action.disabled}
                onClick={action.onClick}
                showLeadingIcon={Boolean(action.icon)}
                leadingIcon={action.icon}
                showLabel={!collapsed}
                aria-label={collapsed ? action.label : undefined}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <nav className="dsn-sidebar-nav" aria-label="Sidebar menu">
        {showSearch && collapsed ? (
          <SidebarMenuSelector
            variant="icon"
            label="Search"
            className="dsn-sidebar-collapsed-search-trigger"
            showIcon
            icon={<Search size={16} aria-hidden />}
            onClick={onCollapsedSearchActivate}
          />
        ) : null}

        {sections.map((section) => {
          const canCollapse = Boolean(!collapsed && section.title && section.showDisclosure);
          const canCollapseWithRowButton = Boolean(canCollapse && !section.trailingAction);
          const isExpanded = canCollapse ? (expandedBySection[section.id] ?? true) : true;
          const itemsRegionId = `${sidebarId}-${section.id}-items`;
          const toggleSectionExpanded = () => {
            setExpandedBySection((prev) => ({
              ...prev,
              [section.id]: !isExpanded,
            }));
          };

          return (
            <React.Fragment key={section.id}>
              {(section.separator === 'before' || section.separator === 'both') && (
                <Separator decorative className="dsn-sidebar-separator" />
              )}

              <section
                className="dsn-sidebar-section"
                aria-label={section.title ?? `Section ${section.id}`}
              >
                {section.title && !collapsed && (
                  canCollapseWithRowButton ? (
                    <button
                      type="button"
                      className="dsn-sidebar-section-toggle"
                      data-expanded={isExpanded || undefined}
                      aria-label={isExpanded ? `Collapse ${section.title}` : `Expand ${section.title}`}
                      aria-expanded={isExpanded}
                      aria-controls={itemsRegionId}
                      onClick={toggleSectionExpanded}
                    >
                      <SectionHeader
                        title={section.title}
                        size="xsmall"
                        leadingControl={(
                          <span className="dsn-sidebar-section-disclosure" data-expanded={isExpanded || undefined}>
                            <ChevronRight size={16} aria-hidden />
                          </span>
                        )}
                        className="dsn-sidebar-section-header"
                      />
                    </button>
                  ) : (
                    <div className="dsn-sidebar-section-header-row">
                      {canCollapse ? (
                        <button
                          type="button"
                          className="dsn-sidebar-section-toggle"
                          data-expanded={isExpanded || undefined}
                          aria-label={isExpanded ? `Collapse ${section.title}` : `Expand ${section.title}`}
                          aria-expanded={isExpanded}
                          aria-controls={itemsRegionId}
                          onClick={toggleSectionExpanded}
                        >
                          <span className="dsn-sidebar-section-disclosure" data-expanded={isExpanded || undefined}>
                            <ChevronRight size={16} aria-hidden />
                          </span>
                          <span className="dsn-sidebar-section-toggle-title">{section.title}</span>
                        </button>
                      ) : (
                        <div className="dsn-sidebar-section-toggle dsn-sidebar-section-toggle-static">
                          {section.showDisclosure ? (
                            <span className="dsn-sidebar-section-disclosure">
                              <ChevronRight size={16} aria-hidden />
                            </span>
                          ) : null}
                          <span className="dsn-sidebar-section-toggle-title">{section.title}</span>
                        </div>
                      )}
                      {section.trailingAction ? (
                        <div className="dsn-sidebar-section-trailing">{section.trailingAction}</div>
                      ) : null}
                    </div>
                  )
                )}

                {isExpanded && (
                  <div className="dsn-sidebar-section-items" id={itemsRegionId}>
                    {section.items.map((item) => (
                      <SidebarMenuSelector
                        key={item.id}
                        variant={collapsed ? 'icon' : 'full'}
                        label={item.label}
                        showIcon={!item.showAvatar && Boolean(item.icon)}
                        icon={item.icon}
                        showAvatar={item.showAvatar}
                        avatarProps={item.avatarProps}
                        showBadge={item.showBadge}
                        badgeCount={item.badgeCount}
                        badgeVariant={item.badgeVariant}
                        selected={item.selected}
                        disabled={item.disabled}
                        onClick={item.onClick}
                        buttonRef={item.buttonRef}
                        aria-haspopup={item['aria-haspopup']}
                        aria-expanded={item['aria-expanded']}
                        aria-controls={item['aria-controls']}
                      />
                    ))}
                  </div>
                )}
              </section>

              {(section.separator === 'after' || section.separator === 'both') && (
                <Separator decorative className="dsn-sidebar-separator" />
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {bottomContent && (
        <div className="dsn-sidebar-bottom">{bottomContent}</div>
      )}
    </aside>
  );
}

export default Sidebar;
