import React from 'react';
import './Tab.css';

export interface TabNavItem {
  href: string;
  label: string;
  /** Marks the item for the page the user is on — renders `aria-current="page"` and the selected style. */
  current?: boolean;
  showLeadingIcon?: boolean;
  leadingIcon?: React.ReactNode;
  showTrailingIcon?: boolean;
  trailingIcon?: React.ReactNode;
}

export interface TabNavProps {
  items: TabNavItem[];
  /** Names the landmark, e.g. "Main" or "Project sections". Required — a page can hold several `<nav>`s. */
  'aria-label': string;
  /**
   * Element or component used for each link. Defaults to `a`. Pass a router link
   * (e.g. Next.js `Link`) to keep client-side navigation and prefetching.
   */
  linkAs?: React.ElementType;
  className?: string;
}

/**
 * Tab-styled navigation between pages: a `<nav>` landmark of links, the current one marked with `aria-current="page"`.
 * Shares `Tab`'s visuals and tokens, but every item is a real link — no tablist, no panels, no roving focus.
 *
 * @aiSelectWhen Each item goes to a different page or route (site sections, app areas, sub-pages of a record)
 *
 * @aiAvoid Do not use to switch panels inside the same page — use Tab instead
 * @aiAvoid Do not use for a display-preference toggle — use SegmentControl instead
 * @aiAvoid Do not use for more than 6–7 destinations — use a sidebar nav instead
 *
 * @aiSpatial Owns the row's internal padding and bottom border but not its own margin; fills its container width.
 *
 * @aiCompose Never mix TabNav and Tab in the same row; exactly one item should be `current` when the page belongs to the row
 */
export function TabNav({ items, 'aria-label': ariaLabel, linkAs: LinkElement = 'a', className }: TabNavProps) {
  const rootClass = ['dsn-tab', 'dsn-tab-nav', className].filter(Boolean).join(' ');

  return (
    <nav className={rootClass} aria-label={ariaLabel}>
      <ul className="dsn-tab-list">
        {items.map((item) => (
          <li key={item.href} className="dsn-tab-nav-item">
            <LinkElement
              href={item.href}
              className="dsn-tab-trigger"
              aria-current={item.current ? 'page' : undefined}
              data-selected={item.current || undefined}
            >
              <span className="dsn-tab-trigger-content">
                {item.showLeadingIcon && (
                  <span className="dsn-tab-icon-wrap" aria-hidden="true">
                    {item.leadingIcon}
                  </span>
                )}

                <span className="dsn-tab-label-wrap">
                  <span className="dsn-tab-label">{item.label}</span>
                </span>

                {item.showTrailingIcon && (
                  <span className="dsn-tab-icon-wrap" aria-hidden="true">
                    {item.trailingIcon}
                  </span>
                )}
              </span>
            </LinkElement>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default TabNav;
