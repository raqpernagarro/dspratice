import { useCallback, useEffect, useRef } from 'react';
import { Checkbox, type CheckboxProps } from '../../atoms/Checkbox';
import { MenuCell, type MenuCellProps, type MenuCellVariant } from '../../atoms/MenuCell';
import { Radio, type RadioProps } from '../../atoms/Radio';
import { SectionHeader } from '../../atoms/SectionHeader';
import './ChoiceList.css';

export type ChoiceListItemKind = 'menu-cell' | 'checkbox-cell' | 'radio-cell';

export interface ChoiceListMenuItem {
  id: string;
  kind: 'menu-cell';
  variant?: MenuCellVariant;
  props?: Partial<MenuCellProps>;
}

export interface ChoiceListCheckboxItem {
  id: string;
  kind: 'checkbox-cell';
  props?: Partial<CheckboxProps>;
}

export interface ChoiceListRadioItem {
  id: string;
  kind: 'radio-cell';
  props?: Partial<RadioProps>;
}

export type ChoiceListItem =
  | ChoiceListMenuItem
  | ChoiceListCheckboxItem
  | ChoiceListRadioItem;

export interface ChoiceListSection {
  id: string;
  title: string;
  items: ChoiceListItem[];
}

/**
 * List-wide row type. Figma: Choice list `Variant`.
 * - `default`   — MenuCell rows
 * - `switchers` — MenuCell rows with a trailing switcher
 * - `checkbox`  — Checkbox rows
 * - `radio`     — Radio rows
 */
export type ChoiceListVariant = 'default' | 'switchers' | 'checkbox' | 'radio';

export interface ChoiceListProps {
  /** Used for aria-label on the root section. */
  title?: string;
  /**
   * Renders every row with the same control, overriding each item's `kind`.
   * Item `props` are forwarded to that control. Omit to use per-item `kind`.
   */
  variant?: ChoiceListVariant;
  sections: ChoiceListSection[];
  showSectionHeaders?: boolean;
  className?: string;
  sectionClassName?: string;
  enableMenuKeyboardNavigation?: boolean;
  onMenuEscape?: () => void;
}

const VARIANT_KIND: Record<ChoiceListVariant, ChoiceListItemKind> = {
  default: 'menu-cell',
  switchers: 'menu-cell',
  checkbox: 'checkbox-cell',
  radio: 'radio-cell',
};

/** Re-types an item for a list-wide `variant`, keeping its id and props. */
function applyVariant(item: ChoiceListItem, variant?: ChoiceListVariant): ChoiceListItem {
  if (!variant) return item;
  const kind = VARIANT_KIND[variant];
  if (kind === 'menu-cell') {
    return {
      id: item.id,
      kind,
      variant: variant === 'switchers' ? 'switcher' : 'default',
      props: item.props as Partial<MenuCellProps>,
    };
  }
  if (kind === 'checkbox-cell') {
    return { id: item.id, kind, props: item.props as Partial<CheckboxProps> };
  }
  return { id: item.id, kind, props: item.props as Partial<RadioProps> };
}

function renderItem(item: ChoiceListItem) {
  if (item.kind === 'menu-cell') {
    const props = item.props ?? {};
    return (
      <MenuCell
        variant={item.variant ?? 'default'}
        label="Label"
        showLeadingIcon={false}
        showTrailingIcon={false}
        {...props}
      />
    );
  }

  if (item.kind === 'checkbox-cell') {
    const props = item.props ?? {};
    return (
      <Checkbox label="Label" showLeadingIcon={false} showTrailingIcon={false} {...props} />
    );
  }

  const props = item.props ?? {};
  return <Radio label="Label" showLeadingIcon={false} showTrailingIcon={false} {...props} />;
}

/**
 * Sectioned list of mixed selectable rows (menu-cell, checkbox-cell, radio-cell) with optional menu keyboard navigation.
 *
 * @aiSelectWhen Menu-like selection surfaces with mixed row kinds grouped into labeled sections
 *
 * @aiAvoid Do not use for a simple single-selection form field — use SingleChoice instead
 * @aiAvoid Do not use for a simple multi-selection form field — use MultiChoice instead
 * @aiAvoid Do not use for a flat list of plain actions with no selection state — use PopoverMenu instead
 *
 * @aiVariant items kind="menu-cell" — triggers an action or navigation, not a persisted selection
 * @aiVariant items kind="checkbox-cell" — independent boolean toggle within the section
 * @aiVariant items kind="radio-cell" — mutually exclusive choice within the section
 *
 * @aiSpatial Owns its own padding; fills its container width
 *
 * @aiCompose Composes MenuCell, Checkbox, Radio, and SectionHeader internally per item kind — configure via item props, never mount these atoms directly as children
 */
export function ChoiceList({
  title = 'Choice list',
  variant,
  sections,
  showSectionHeaders = true,
  className,
  sectionClassName,
  enableMenuKeyboardNavigation = false,
  onMenuEscape,
}: ChoiceListProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rootClass = ['dsn-choice-list', className].filter(Boolean).join(' ');
  const sectionClass = ['dsn-choice-list-section', sectionClassName]
    .filter(Boolean)
    .join(' ');

  const getEnabledMenuItems = useCallback(() => {
    if (!rootRef.current) {
      return [] as HTMLElement[];
    }

    return Array.from(
      rootRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'),
    );
  }, []);

  const setRovingTabStop = useCallback(
    (nextIndex: number) => {
      const items = getEnabledMenuItems();
      if (items.length === 0) {
        return;
      }

      const boundedIndex = Math.min(Math.max(nextIndex, 0), items.length - 1);
      items.forEach((item, index) => {
        item.tabIndex = index === boundedIndex ? 0 : -1;
      });
    },
    [getEnabledMenuItems],
  );

  useEffect(() => {
    if (!enableMenuKeyboardNavigation) {
      return;
    }
    setRovingTabStop(0);
  }, [enableMenuKeyboardNavigation, sections, setRovingTabStop]);

  return (
    <div
      ref={rootRef}
      role="group"
      className={rootClass}
      aria-label={title}
      onKeyDown={(event) => {
        if (!enableMenuKeyboardNavigation) {
          return;
        }

        const items = getEnabledMenuItems();
        if (items.length === 0) {
          return;
        }

        const activeElement = document.activeElement as HTMLElement | null;
        const activeIndex = activeElement ? items.indexOf(activeElement) : -1;
        const currentIndex = activeIndex >= 0 ? activeIndex : 0;

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % items.length;
          setRovingTabStop(nextIndex);
          items[nextIndex]?.focus();
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          const previousIndex = (currentIndex - 1 + items.length) % items.length;
          setRovingTabStop(previousIndex);
          items[previousIndex]?.focus();
          return;
        }

        if (event.key === 'Home') {
          event.preventDefault();
          setRovingTabStop(0);
          items[0]?.focus();
          return;
        }

        if (event.key === 'End') {
          event.preventDefault();
          const lastIndex = items.length - 1;
          setRovingTabStop(lastIndex);
          items[lastIndex]?.focus();
          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          onMenuEscape?.();
        }
      }}
    >
      <div className="dsn-choice-list-sections">
        {sections.map((section) => (
          <div key={section.id} role="group" className={sectionClass} aria-label={section.title}>
            {showSectionHeaders && <SectionHeader title={section.title} size="small" />}
            <div className="dsn-choice-list-items">
              {section.items.map((item) => (
                <div key={item.id} className="dsn-choice-list-item">
                  {renderItem(applyVariant(item, variant))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChoiceList;
