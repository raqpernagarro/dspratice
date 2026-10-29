import React from 'react';
import './Tab.css';

export interface TabItem {
  value: string;
  label: string;
  panel?: React.ReactNode;
  disabled?: boolean;
  showLeadingIcon?: boolean;
  leadingIcon?: React.ReactNode;
  showTrailingIcon?: boolean;
  trailingIcon?: React.ReactNode;
  'aria-label'?: string;
}

export interface TabProps {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  showPanels?: boolean;
  panelClassName?: string;
  'aria-label'?: string;
}

function getFirstSelectableValue(tabs: TabItem[]): string {
  const firstEnabled = tabs.find((tab) => !tab.disabled);
  return (firstEnabled ?? tabs[0])?.value ?? '';
}

/**
 * role="tablist" row of triggers that switches between associated content panels (role="tabpanel") without navigation.
 *
 * @aiSelectWhen Content can be divided into parallel, mutually exclusive sections the user might switch between
 * @aiSelectWhen Presenting alternative, substantial data views where each view is its own named section
 *
 * @aiAvoid Do not use for sequential steps — use a stepper instead
 * @aiAvoid Do not use for a display-preference toggle with no distinct content panel — use SegmentControl instead
 * @aiAvoid Do not use for filtering the same content — use Chip or a filter panel instead
 *
 * @aiVariant showPanels={true} — tab row controls visible content panels rendered by Tab itself
 * @aiVariant showPanels={false} — tab row only drives external state/content rendered elsewhere
 *
 * @aiSpatial Owns the tab list row and panel internal padding but not its own margin from surrounding content; the selected panel must render directly below the tab row.
 *
 * @aiCompose Never nest Tab within another Tab's panel; never mix Tab and CustomViewTab items in the same row
 */
export function Tab({
  tabs,
  value,
  defaultValue,
  onChange,
  className,
  showPanels = true,
  panelClassName,
  'aria-label': ariaLabel = 'Tabs',
}: TabProps) {
  const firstSelectableValue = React.useMemo(() => getFirstSelectableValue(tabs), [tabs]);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? firstSelectableValue);
  const selectedValue = isControlled ? value : internalValue;
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

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

  const rootClass = ['dsn-tab', className].filter(Boolean).join(' ');
  const panelRootClass = ['dsn-tab-panel', panelClassName].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <div className="dsn-tab-list" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab, index) => {
          const isSelected = tab.value === selectedValue;
          const isDisabled = Boolean(tab.disabled);
          const tabId = `dsn-tab-${tab.value}`;
          const panelId = `dsn-tabpanel-${tab.value}`;
          const tabIndex = isSelected ? 0 : -1;

          return (
            <button
              key={tab.value}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              className="dsn-tab-trigger"
              type="button"
              role="tab"
              id={tabId}
              aria-controls={showPanels ? panelId : undefined}
              aria-selected={isSelected}
              aria-label={tab['aria-label']}
              aria-disabled={isDisabled || undefined}
              disabled={isDisabled}
              data-selected={isSelected || undefined}
              tabIndex={tabIndex}
              onClick={() => selectTab(tab.value)}
              onKeyDown={(event) => {
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
                }
              }}
            >
              <span className="dsn-tab-trigger-content">
                {tab.showLeadingIcon && (
                  <span className="dsn-tab-icon-wrap" aria-hidden="true">
                    {tab.leadingIcon}
                  </span>
                )}

                <span className="dsn-tab-label-wrap">
                  <span className="dsn-tab-label">{tab.label}</span>
                </span>

                {tab.showTrailingIcon && (
                  <span className="dsn-tab-icon-wrap" aria-hidden="true">
                    {tab.trailingIcon}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {showPanels &&
        tabs.map((tab) => {
          const panelId = `dsn-tabpanel-${tab.value}`;
          const tabId = `dsn-tab-${tab.value}`;
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

export default Tab;
