import React from 'react';
import { Plus } from 'lucide-react';
import { X } from 'lucide-react';
import { Button } from '../Button';
import './CustomViewTab.css';

export interface CustomViewTabItem {
  value: string;
  label: string;
  panel?: React.ReactNode;
  disabled?: boolean;
  showLeadingIcon?: boolean;
  leadingIcon?: React.ReactNode;
  removable?: boolean;
  removeAriaLabel?: string;
  'aria-label'?: string;
}

export interface CustomViewTabProps {
  tabs: ReadonlyArray<CustomViewTabItem>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onRemove?: (value: string) => void;
  addActionLabel?: string;
  addActionLeadingIcon?: React.ReactNode;
  onAddAction?: () => void;
  addActionAriaLabel?: string;
  className?: string;
  showPanels?: boolean;
  panelClassName?: string;
  'aria-label'?: string;
}

export type CustomViewTabsProps = CustomViewTabProps;

function getFirstSelectableValue(tabs: ReadonlyArray<CustomViewTabItem>): string {
  const firstEnabled = tabs.find((tab) => !tab.disabled);
  return (firstEnabled ?? tabs[0])?.value ?? '';
}

export function CustomViewTab({
  tabs,
  value,
  defaultValue,
  onChange,
  onRemove,
  addActionLabel,
  addActionLeadingIcon,
  onAddAction,
  addActionAriaLabel,
  className,
  showPanels = true,
  panelClassName,
  'aria-label': ariaLabel = 'Custom views',
}: CustomViewTabProps) {
  const firstSelectableValue = React.useMemo(() => getFirstSelectableValue(tabs), [tabs]);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? firstSelectableValue);
  const selectedValue = isControlled ? value : internalValue;
  const tabRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  React.useEffect(() => {
    if (!isControlled && tabs.every((tab) => tab.value !== internalValue)) {
      setInternalValue(firstSelectableValue);
    }
  }, [firstSelectableValue, internalValue, isControlled, tabs]);

  const selectTab = React.useCallback(
    (nextValue: string) => {
      const nextTab = tabs.find((tab) => tab.value === nextValue);
      if (!nextTab || nextTab.disabled) {
        return;
      }

      if (!isControlled) {
        setInternalValue(nextValue);
      }

      if (nextValue !== selectedValue) {
        onChange?.(nextValue);
      }
    },
    [isControlled, onChange, selectedValue, tabs],
  );

  const findNextEnabledIndex = React.useCallback(
    (startIndex: number, direction: 1 | -1): number => {
      if (tabs.length === 0) {
        return -1;
      }

      let index = startIndex;
      for (let attempt = 0; attempt < tabs.length; attempt += 1) {
        index = (index + direction + tabs.length) % tabs.length;
        if (!tabs[index].disabled) {
          return index;
        }
      }

      return -1;
    },
    [tabs],
  );

  const focusTabByIndex = React.useCallback((index: number) => {
    if (index < 0) {
      return;
    }

    tabRefs.current[index]?.focus();
  }, []);

  const rootClass = ['dsn-custom-view-tabs', className].filter(Boolean).join(' ');
  const panelRootClass = ['dsn-custom-view-tabs-panel', panelClassName].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <div className="dsn-custom-view-tabs-header">
        <div className="dsn-custom-view-tabs-list" role="tablist" aria-label={ariaLabel}>
          {tabs.map((tab, index) => {
            const isSelected = tab.value === selectedValue;
            const isDisabled = Boolean(tab.disabled);
            const canRemove = tab.removable !== false;
            const showLeadingIcon = tab.showLeadingIcon !== false;
            const tabId = `dsn-custom-tab-${tab.value}`;
            const panelId = `dsn-custom-tabpanel-${tab.value}`;
            const tabIndex = isSelected ? 0 : -1;

            return (
              <div
                key={tab.value}
                className="dsn-custom-view-tabs-item"
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                role="tab"
                id={tabId}
                aria-controls={showPanels ? panelId : undefined}
                aria-selected={isSelected}
                aria-label={tab['aria-label']}
                aria-disabled={isDisabled || undefined}
                data-selected={isSelected || undefined}
                data-disabled={isDisabled || undefined}
                tabIndex={isDisabled ? -1 : tabIndex}
                onClick={() => {
                  if (isDisabled) return;
                  selectTab(tab.value);
                }}
                onKeyDown={(event) => {
                  if (isDisabled) return;

                  if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    const nextIndex = findNextEnabledIndex(index, 1);
                    focusTabByIndex(nextIndex);
                    return;
                  }

                  if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    const nextIndex = findNextEnabledIndex(index, -1);
                    focusTabByIndex(nextIndex);
                    return;
                  }

                  if (event.key === 'Home') {
                    event.preventDefault();
                    const firstEnabledIndex = tabs.findIndex((nextTab) => !nextTab.disabled);
                    focusTabByIndex(firstEnabledIndex);
                    return;
                  }

                  if (event.key === 'End') {
                    event.preventDefault();
                    const reversedIndex = [...tabs].reverse().findIndex((nextTab) => !nextTab.disabled);
                    const lastEnabledIndex = reversedIndex < 0 ? -1 : tabs.length - 1 - reversedIndex;
                    focusTabByIndex(lastEnabledIndex);
                    return;
                  }

                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    selectTab(tab.value);
                    return;
                  }

                  if (event.key === 'Delete' && canRemove) {
                    event.preventDefault();
                    onRemove?.(tab.value);
                  }
                }}
              >
                {showLeadingIcon && (
                  <span
                    className="dsn-custom-view-tabs-icon"
                    data-icon={tab.leadingIcon ? 'custom' : 'default'}
                    aria-hidden="true"
                  >
                    {tab.leadingIcon}
                  </span>
                )}

                <span className="dsn-custom-view-tabs-label-wrap">
                  <span className="dsn-custom-view-tabs-label">{tab.label}</span>
                </span>

                {/*
                  Remove action is intentionally aria-hidden — it is a visual mouse
                  affordance only. Keyboard users remove tabs with the Delete key
                  (handled in the onKeyDown above on the tab itself).
                */}
                {canRemove && (
                  <span
                    className="dsn-custom-view-tabs-remove"
                    aria-hidden="true"
                    onClick={(event) => {
                      if (isDisabled) return;
                      event.stopPropagation();
                      event.preventDefault();
                      onRemove?.(tab.value);
                    }}
                  >
                    <X size={16} aria-hidden="true" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {addActionLabel && (
          <span className="dsn-custom-view-tabs-add-wrap">
            <Button
              className="dsn-custom-view-tabs-add-button"
              variant="ghost"
              size="md"
              showLeadingIcon
              leadingIcon={addActionLeadingIcon ?? <Plus size={16} aria-hidden="true" />}
              aria-label={addActionAriaLabel ?? addActionLabel}
              onClick={onAddAction}
            >
              {addActionLabel}
            </Button>
          </span>
        )}
      </div>

      {showPanels &&
        tabs.map((tab) => {
          const panelId = `dsn-custom-tabpanel-${tab.value}`;
          const tabId = `dsn-custom-tab-${tab.value}`;
          const isSelected = tab.value === selectedValue;

          return (
            <div
              key={tab.value}
              className={panelRootClass}
              role="tabpanel"
              id={panelId}
              aria-labelledby={tabId}
              hidden={!isSelected}
            >
              {tab.panel}
            </div>
          );
        })}
    </div>
  );
}

export const CustomViewTabs = CustomViewTab;
export default CustomViewTab;
