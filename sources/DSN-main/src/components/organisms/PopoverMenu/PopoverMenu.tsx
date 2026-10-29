import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../atoms/Button';
import { ButtonGroup } from '../../atoms/ButtonGroup';
import { SearchBar, type SearchBarProps } from '../../atoms/SearchBar';
import {
  SegmentControl,
  type SegmentControlOption,
  type SegmentControlProps,
} from '../../atoms/SegmentControl';
import { SectionHeader } from '../../atoms/SectionHeader';
import {
  ChoiceList,
  type ChoiceListItem,
  type ChoiceListSection,
} from '../../molecules/ChoiceList';
import { PopoverWrapper, type PopoverWrapperProps } from '../../molecules/PopoverWrapper';
import { Toolbar } from '../../molecules/Toolbar';
import './PopoverMenu.css';

export type PopoverMenuVariant = 'rich' | 'simple';

export interface PopoverMenuChoiceList {
  id: string;
  title?: string;
  showSectionHeaders?: boolean;
  sections: ChoiceListSection[];
}

export type PopoverMenuAnchorProps = Pick<
  PopoverWrapperProps,
  | 'anchorRef'
  | 'offset'
  | 'viewportMargin'
  | 'matchAnchorWidth'
  | 'minWidth'
  | 'width'
  | 'repositionOnScroll'
  | 'onExternalScroll'
>;

export interface PopoverMenuProps extends PopoverMenuAnchorProps {
  variant?: PopoverMenuVariant;
  title?: string;
  showHeader?: boolean;
  showSegmentControl?: boolean;
  segmentControlOptions?: SegmentControlOption[];
  segmentControlProps?: Omit<SegmentControlProps, 'options'>;
  showSearch?: boolean;
  searchProps?: Omit<SearchBarProps, 'variant'>;
  choiceLists?: PopoverMenuChoiceList[];
  simpleItems?: ChoiceListItem[];
  showBottomBar?: boolean;
  bottomBarLeftActions?: React.ReactNode;
  bottomBarRightActions?: React.ReactNode;
  /** Override the header trailing slot. Filter popovers auto-render Clear when checkboxes are selected. */
  headerTrailingControl?: React.ReactNode;
  /**
   * Shows a Clear control in the header when any checkbox filter is selected.
   * Defaults to true when `choiceLists` include checkbox-cell items.
   */
  showClearFilters?: boolean;
  /** Called after the header Clear control resets all checkbox filters in the popover. */
  onClearFilters?: () => void;
  className?: string;
  'aria-label'?: string;
  onEscape?: () => void;
}

const DEFAULT_SEGMENT_OPTIONS: SegmentControlOption[] = [
  { value: 'first', label: 'Label' },
  { value: 'second', label: 'Label' },
];

const DEFAULT_SIMPLE_ITEMS: ChoiceListItem[] = Array.from({ length: 4 }, (_, index) => ({
  id: `simple-item-${index + 1}`,
  kind: 'menu-cell',
  props: {
    label: 'Label',
    showLeadingIcon: false,
    showTrailingIcon: false,
  },
}));

function choiceListsIncludeCheckboxFilters(choiceLists: PopoverMenuChoiceList[]): boolean {
  return choiceLists.some((list) =>
    list.sections.some((section) =>
      section.items.some((item) => item.kind === 'checkbox-cell'),
    ),
  );
}

function countCheckedCheckboxFilters(choiceLists: PopoverMenuChoiceList[]): number {
  return choiceLists.reduce(
    (count, list) =>
      count +
      list.sections.reduce(
        (sectionCount, section) =>
          sectionCount +
          section.items.filter(
            (item) => item.kind === 'checkbox-cell' && Boolean(item.props?.checked),
          ).length,
        0,
      ),
    0,
  );
}

function clearCheckboxFilters(choiceLists: PopoverMenuChoiceList[]): PopoverMenuChoiceList[] {
  return choiceLists.map((list) => ({
    ...list,
    sections: list.sections.map((section) => ({
      ...section,
      items: section.items.map((item) =>
        item.kind === 'checkbox-cell'
          ? {
              ...item,
              props: {
                ...item.props,
                checked: false,
              },
            }
          : item,
      ),
    })),
  }));
}

function updateCheckboxFilter(
  choiceLists: PopoverMenuChoiceList[],
  listId: string,
  sectionId: string,
  itemId: string,
  checked: boolean,
): PopoverMenuChoiceList[] {
  return choiceLists.map((list) =>
    list.id !== listId
      ? list
      : {
          ...list,
          sections: list.sections.map((section) =>
            section.id !== sectionId
              ? section
              : {
                  ...section,
                  items: section.items.map((item) =>
                    item.id !== itemId || item.kind !== 'checkbox-cell'
                      ? item
                      : {
                          ...item,
                          props: {
                            ...item.props,
                            checked,
                          },
                        },
                  ),
                },
          ),
        },
  );
}

export function PopoverMenu({
  anchorRef,
  offset,
  viewportMargin,
  matchAnchorWidth = false,
  minWidth,
  width,
  repositionOnScroll,
  onExternalScroll,
  variant = 'rich',
  title = 'Title',
  showHeader = true,
  showSegmentControl = false,
  segmentControlOptions = DEFAULT_SEGMENT_OPTIONS,
  segmentControlProps,
  showSearch = false,
  searchProps,
  choiceLists,
  simpleItems = DEFAULT_SIMPLE_ITEMS,
  showBottomBar = false,
  bottomBarLeftActions,
  bottomBarRightActions,
  headerTrailingControl,
  showClearFilters,
  onClearFilters,
  className,
  'aria-label': ariaLabel = 'Popover menu',
  onEscape,
}: PopoverMenuProps) {
  const rootClass = ['dsn-popover-menu', className].filter(Boolean).join(' ');
  const resolvedChoiceLists = useMemo(
    () =>
      choiceLists ??
      (variant === 'simple'
        ? [
            {
              id: 'simple-choice-list',
              showSectionHeaders: false,
              sections: [
                {
                  id: 'simple-section',
                  title: 'Actions',
                  items: simpleItems,
                },
              ],
            },
          ]
        : []),
    [choiceLists, simpleItems, variant],
  );

  const isFilterPopover = choiceListsIncludeCheckboxFilters(resolvedChoiceLists);
  const [draftChoiceLists, setDraftChoiceLists] = useState(resolvedChoiceLists);

  useEffect(() => {
    if (isFilterPopover) {
      setDraftChoiceLists(resolvedChoiceLists);
    }
  }, [isFilterPopover, resolvedChoiceLists]);

  const handleCheckboxChange = useCallback(
    (listId: string, sectionId: string, itemId: string, checked: boolean) => {
      setDraftChoiceLists((current) =>
        updateCheckboxFilter(current, listId, sectionId, itemId, checked),
      );
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setDraftChoiceLists((current) => clearCheckboxFilters(current));
    onClearFilters?.();
  }, [onClearFilters]);

  const interactiveChoiceLists = useMemo(() => {
    if (!isFilterPopover) {
      return draftChoiceLists;
    }

    return draftChoiceLists.map((list) => ({
      ...list,
      sections: list.sections.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          if (item.kind !== 'checkbox-cell') {
            return item;
          }

          const existingOnCheckedChange = item.props?.onCheckedChange;

          return {
            ...item,
            props: {
              ...item.props,
              onCheckedChange: (checked: boolean) => {
                handleCheckboxChange(list.id, section.id, item.id, checked);
                existingOnCheckedChange?.(checked);
              },
            },
          };
        }),
      })),
    }));
  }, [draftChoiceLists, handleCheckboxChange, isFilterPopover]);

  const shouldShowClearFilters =
    (showClearFilters ?? isFilterPopover) && countCheckedCheckboxFilters(draftChoiceLists) > 0;

  const resolvedHeaderTrailingControl =
    headerTrailingControl ??
    (shouldShowClearFilters ? (
      <Button variant="ghost" size="md" onClick={handleClearFilters}>
        Clear
      </Button>
    ) : undefined);

  const isAnchored = anchorRef !== undefined;

  return (
    <PopoverWrapper
      anchorRef={anchorRef}
      offset={offset}
      viewportMargin={viewportMargin}
      matchAnchorWidth={matchAnchorWidth}
      minWidth={minWidth}
      width={width}
      repositionOnScroll={repositionOnScroll ?? isAnchored}
      onExternalScroll={onExternalScroll}
      className={rootClass}
      role="dialog"
      aria-label={ariaLabel}
      header={
        showHeader ? (
          <SectionHeader title={title} size="medium" trailingControl={resolvedHeaderTrailingControl} />
        ) : undefined
      }
      segment={
        showSegmentControl ? (
          <div className="dsn-popover-menu-segment">
            <SegmentControl options={segmentControlOptions} fullWidth {...segmentControlProps} />
          </div>
        ) : undefined
      }
      search={
        showSearch ? (
          <div className="dsn-popover-menu-search">
            <SearchBar variant="ghost" placeholder="Search" aria-label="Search" {...searchProps} />
          </div>
        ) : undefined
      }
      content={
        <div className="dsn-popover-menu-lists" role="menu" aria-label={ariaLabel} data-variant={variant}>
          {interactiveChoiceLists.map((list) => (
            <ChoiceList
              key={list.id}
              title={list.title}
              showSectionHeaders={list.showSectionHeaders}
              sections={list.sections}
              className="dsn-popover-menu-choice-list"
              enableMenuKeyboardNavigation
              onMenuEscape={onEscape}
            />
          ))}
        </div>
      }
      bottomBar={
        showBottomBar ? (
          <Toolbar
            size="md"
            className="dsn-popover-menu-bottom-bar"
            leftActions={bottomBarLeftActions}
            rightActions={
              bottomBarRightActions ?? (
                <ButtonGroup size="md" spaceBetween aria-label="Popover actions">
                  <Button variant="ghost" size="md">
                    Cancel
                  </Button>
                  <Button variant="primary" size="md">
                    Confirm
                  </Button>
                </ButtonGroup>
              )
            }
          />
        ) : undefined
      }
    />
  );
}

export default PopoverMenu;
