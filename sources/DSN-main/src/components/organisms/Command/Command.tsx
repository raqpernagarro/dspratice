import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Search } from 'lucide-react';
import { Shortcut } from '../../atoms/Shortcut';
import { Modal } from '../Modal';
import { commandScore } from './commandScore';
import './Command.css';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Returns 0 to hide an item, or a positive rank (higher = earlier). */
export type CommandFilter = (value: string, search: string, keywords: string[]) => number;

export interface CommandProps {
  /** Controlled search text. */
  search?: string;
  /** Initial search text when uncontrolled. */
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  /**
   * When false, every item stays visible in source order — use when the
   * consumer filters the items itself (e.g. server-side search).
   * @default true
   */
  shouldFilter?: boolean;
  /** Custom ranking. Defaults to a fuzzy match on `value` and `keywords`. */
  filter?: CommandFilter;
  /**
   * Arrow keys wrap from the last item to the first and back.
   * @default true
   */
  loop?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface CommandInputProps {
  /** @default 'Type a command or search' */
  placeholder?: string;
  /** @default 'Search' */
  'aria-label'?: string;
  className?: string;
}

export interface CommandListProps {
  /** @default 'Results' */
  'aria-label'?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface CommandEmptyProps {
  /** @default 'No results. Try a different search.' */
  children?: React.ReactNode;
  className?: string;
}

export interface CommandGroupProps {
  /** Visible group label, e.g. "Components". Omit for an unlabelled group. */
  heading?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface CommandItemProps {
  /** Text matched against the search and passed to `onSelect`. Must be unique within the menu. */
  value: string;
  /** Displayed text. @default value */
  label?: string;
  /** Secondary line under the label. Not searched — add the words to `keywords` if they should match. */
  description?: string;
  /** Extra search terms (synonyms, category, path) that are not displayed. */
  keywords?: string[];
  /** Lucide icon rendered before the label. */
  leadingIcon?: React.ReactNode;
  /** Shortcut hint, e.g. "⌘ N". Display only — wiring the shortcut is the consumer's job. */
  shortcutLabel?: string;
  /** Plain-English key names for `shortcutLabel`, e.g. "Command N". Required with `shortcutLabel`. */
  shortcutAriaLabel?: string;
  disabled?: boolean;
  /** Runs on click or Enter while the item is active. */
  onSelect?: (value: string) => void;
  className?: string;
}

export interface CommandSeparatorProps {
  /** Keep the separator while a search is active. @default false */
  alwaysRender?: boolean;
  className?: string;
}

export interface CommandDialogProps extends CommandProps {
  /** Accessible name for the dialog. @default 'Command menu' */
  'aria-label'?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ─── Internal store ───────────────────────────────────────────────────────────

interface ItemRecord {
  id: string;
  value: string;
  keywords: string[];
  groupId: string | null;
  disabled: boolean;
  seq: number;
  getNode: () => HTMLElement | null;
  select: () => void;
}

interface CommandContextValue {
  search: string;
  setSearch: (search: string) => void;
  listId: string;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  registerItem: (record: ItemRecord) => () => void;
  isVisible: (id: string) => boolean;
  isGroupVisible: (groupId: string) => boolean;
  getOrder: (id: string) => number | undefined;
  visibleCount: number;
  onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
}

const CommandContext = createContext<CommandContextValue | null>(null);
const GroupContext = createContext<string | null>(null);

function useCommandContext(part: string): CommandContextValue {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error(`<${part}> must be rendered inside <Command>.`);
  }
  return context;
}

function compareDomOrder(a: ItemRecord, b: ItemRecord): number {
  const nodeA = a.getNode();
  const nodeB = b.getNode();
  if (nodeA && nodeB && nodeA !== nodeB) {
    return nodeA.compareDocumentPosition(nodeB) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  }
  return a.seq - b.seq;
}

// ─── Command ──────────────────────────────────────────────────────────────────

/**
 * Searchable list of actions or destinations, driven from a text input.
 * Focus stays in the input; arrow keys move the active item and Enter runs it.
 * Compose with CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem
 * and CommandSeparator. Wrap in CommandDialog for a ⌘K palette.
 *
 * @aiSelectWhen Jumping to a page, record or action by name — site search, ⌘K palettes, "go to…" menus
 * @aiSelectWhen A long list of actions that users find faster by typing than by scanning
 *
 * @aiAvoid Do not use to pick a form value — use Combobox (searchable) or Select instead
 * @aiAvoid Do not use for a short, fixed set of actions on a trigger — use PopoverMenu instead
 * @aiAvoid Do not use to filter a table or list on the page — use SearchBar instead
 * @aiAvoid Do not use for multi-select — use Combobox selectionMode="multi" instead
 *
 * @aiSpatial Fills its container's width and bounded height; owns its padding, no margin. CommandList scrolls, the input row stays fixed.
 *
 * @aiCompose CommandInput first, then CommandList containing CommandEmpty, CommandGroup › CommandItem and CommandSeparator
 * @aiCompose Never put Command inside Modal yourself — use CommandDialog
 * @aiCompose Put search words in CommandItem.keywords — description is display only and not searched
 */
export function Command({
  search: searchProp,
  defaultSearch = '',
  onSearchChange,
  shouldFilter = true,
  filter = commandScore,
  loop = true,
  className,
  children,
}: CommandProps) {
  const listId = `dsn-command-list-${useId()}`;
  const isSearchControlled = searchProp !== undefined;
  const [internalSearch, setInternalSearch] = useState(defaultSearch);
  const search = isSearchControlled ? searchProp : internalSearch;

  const itemsRef = useRef(new Map<string, ItemRecord>());
  const seqRef = useRef(0);
  const [version, setVersion] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  const setSearch = useCallback(
    (next: string) => {
      if (!isSearchControlled) setInternalSearch(next);
      onSearchChange?.(next);
    },
    [isSearchControlled, onSearchChange],
  );

  const registerItem = useCallback((record: ItemRecord) => {
    record.seq = seqRef.current++;
    itemsRef.current.set(record.id, record);
    setVersion((v) => v + 1);
    return () => {
      itemsRef.current.delete(record.id);
      setVersion((v) => v + 1);
    };
  }, []);

  const isSearching = shouldFilter && search.trim().length > 0;

  // Scores, visibility, and the visual/keyboard order of visible items.
  const { scores, navOrder, orderMap, visibleGroups } = useMemo(() => {
    const nextScores = new Map<string, number>();
    const records = Array.from(itemsRef.current.values());
    for (const record of records) {
      nextScores.set(record.id, isSearching ? filter(record.value, search, record.keywords) : 1);
    }

    const visible = records.filter((record) => (nextScores.get(record.id) ?? 0) > 0);
    const groups = new Set(visible.map((record) => record.groupId).filter((id): id is string => id !== null));
    const order = new Map<string, number>();

    if (!isSearching) {
      return {
        scores: nextScores,
        navOrder: visible.sort(compareDomOrder),
        orderMap: order,
        visibleGroups: groups,
      };
    }

    // Rank items within their group, then rank groups (and loose items) by their best item.
    const byScore = (a: ItemRecord, b: ItemRecord) =>
      (nextScores.get(b.id) ?? 0) - (nextScores.get(a.id) ?? 0) || compareDomOrder(a, b);
    const buckets = new Map<string, ItemRecord[]>();
    for (const record of visible) {
      const key = record.groupId ?? record.id;
      const bucket = buckets.get(key) ?? [];
      bucket.push(record);
      buckets.set(key, bucket);
    }
    const rankedBuckets = Array.from(buckets.entries())
      .map(([key, bucket]) => ({ key, items: bucket.sort(byScore) }))
      .sort((a, b) => byScore(a.items[0], b.items[0]));

    const ordered: ItemRecord[] = [];
    rankedBuckets.forEach(({ key, items }, bucketIndex) => {
      order.set(key, bucketIndex);
      items.forEach((record, itemIndex) => {
        if (record.groupId !== null) order.set(record.id, itemIndex);
        ordered.push(record);
      });
    });

    return { scores: nextScores, navOrder: ordered, orderMap: order, visibleGroups: groups };
    // `version` re-runs this when items mount, unmount or change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, isSearching, search, version]);

  const enabledOrder = useMemo(() => navOrder.filter((record) => !record.disabled), [navOrder]);
  const enabledKey = enabledOrder.map((record) => record.id).join('|');

  // Highlight the best match whenever the search changes.
  useEffect(() => {
    setActiveId(enabledOrder[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Keep the active item valid when items appear or disappear.
  useEffect(() => {
    setActiveId((current) =>
      current && enabledOrder.some((record) => record.id === current) ? current : enabledOrder[0]?.id ?? null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKey]);

  useEffect(() => {
    if (!activeId) return;
    const node = itemsRef.current.get(activeId)?.getNode();
    const list = node?.closest<HTMLElement>('.dsn-command-list');
    if (!node || !list) return;
    // Scroll only the list: scrollIntoView would also scroll the page to a Command rendered below the fold.
    const box = list.getBoundingClientRect();
    const item = node.getBoundingClientRect();
    if (item.top < box.top) list.scrollTop += item.top - box.top;
    else if (item.bottom > box.bottom) list.scrollTop += item.bottom - box.bottom;
  }, [activeId]);

  useEffect(() => {
    if (!isSearching) {
      setLiveMessage('');
      return;
    }
    const count = navOrder.length;
    setLiveMessage(count === 0 ? 'No results' : `${count} ${count === 1 ? 'result' : 'results'}`);
  }, [isSearching, navOrder.length]);

  const move = useCallback(
    (delta: 1 | -1) => {
      if (enabledOrder.length === 0) return;
      const index = enabledOrder.findIndex((record) => record.id === activeId);
      let next = index === -1 ? (delta === 1 ? 0 : enabledOrder.length - 1) : index + delta;
      if (next < 0) next = loop ? enabledOrder.length - 1 : 0;
      if (next >= enabledOrder.length) next = loop ? 0 : enabledOrder.length - 1;
      setActiveId(enabledOrder[next].id);
    },
    [activeId, enabledOrder, loop],
  );

  const onInputKeyDown = useCallback<React.KeyboardEventHandler<HTMLInputElement>>(
    (event) => {
      if (event.nativeEvent.isComposing) return;
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          move(1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          move(-1);
          break;
        case 'Home':
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            setActiveId(enabledOrder[0]?.id ?? null);
          }
          break;
        case 'End':
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            setActiveId(enabledOrder[enabledOrder.length - 1]?.id ?? null);
          }
          break;
        case 'Enter': {
          const active = activeId ? itemsRef.current.get(activeId) : undefined;
          if (active && !active.disabled) {
            event.preventDefault();
            active.select();
          }
          break;
        }
        default:
          break;
      }
    },
    [activeId, enabledOrder, move],
  );

  const context = useMemo<CommandContextValue>(
    () => ({
      search,
      setSearch,
      listId,
      activeId,
      setActiveId,
      registerItem,
      isVisible: (id) => (scores.get(id) ?? 1) > 0,
      isGroupVisible: (groupId) => visibleGroups.has(groupId),
      getOrder: (id) => orderMap.get(id),
      visibleCount: navOrder.length,
      onInputKeyDown,
    }),
    [activeId, listId, navOrder.length, onInputKeyDown, orderMap, registerItem, scores, search, setSearch, visibleGroups],
  );

  return (
    <CommandContext.Provider value={context}>
      <div
        className={['dsn-command', className].filter(Boolean).join(' ')}
        data-searching={isSearching || undefined}
      >
        {children}
        <span className="dsn-command-sr-only" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </span>
      </div>
    </CommandContext.Provider>
  );
}

// ─── Parts ────────────────────────────────────────────────────────────────────

/** Search field for a Command. Focus stays here while arrow keys move through results. */
export function CommandInput({
  placeholder = 'Type a command or search',
  'aria-label': ariaLabel = 'Search',
  className,
}: CommandInputProps) {
  const { search, setSearch, listId, activeId, onInputKeyDown, visibleCount } = useCommandContext('CommandInput');

  return (
    <div className={['dsn-command-input-wrap', className].filter(Boolean).join(' ')}>
      <Search className="dsn-command-input-icon" size={16} aria-hidden="true" />
      <input
        className="dsn-command-input"
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={visibleCount > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId ?? undefined}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={onInputKeyDown}
      />
    </div>
  );
}

/** Scrollable listbox that holds the groups and items. */
export function CommandList({ 'aria-label': ariaLabel = 'Results', className, children }: CommandListProps) {
  const { listId } = useCommandContext('CommandList');
  return (
    <div id={listId} className={['dsn-command-list', className].filter(Boolean).join(' ')} role="listbox" aria-label={ariaLabel}>
      <div className="dsn-command-list-stack">{children}</div>
    </div>
  );
}

/** Shown only when no item matches the search. */
export function CommandEmpty({ children = 'No results. Try a different search.', className }: CommandEmptyProps) {
  const { visibleCount } = useCommandContext('CommandEmpty');
  if (visibleCount > 0) return null;
  return (
    <div className={['dsn-command-empty', className].filter(Boolean).join(' ')} role="presentation">
      {children}
    </div>
  );
}

/** Labelled section of items. Hidden automatically when none of its items match. */
export function CommandGroup({ heading, className, children }: CommandGroupProps) {
  const { isGroupVisible, getOrder } = useCommandContext('CommandGroup');
  const groupId = `dsn-command-group-${useId()}`;
  const headingId = `${groupId}-heading`;

  return (
    <GroupContext.Provider value={groupId}>
      <div
        className={['dsn-command-group', className].filter(Boolean).join(' ')}
        role="group"
        aria-labelledby={heading ? headingId : undefined}
        hidden={!isGroupVisible(groupId)}
        style={{ order: getOrder(groupId) }}
      >
        {heading && (
          <div id={headingId} className="dsn-command-group-heading" aria-hidden="true">
            {heading}
          </div>
        )}
        <div className="dsn-command-group-items">{children}</div>
      </div>
    </GroupContext.Provider>
  );
}

/** One selectable row. Runs `onSelect` on click or Enter. */
export function CommandItem({
  value,
  label,
  description,
  keywords,
  leadingIcon,
  shortcutLabel,
  shortcutAriaLabel,
  disabled = false,
  onSelect,
  className,
}: CommandItemProps) {
  const { registerItem, isVisible, getOrder, activeId, setActiveId } = useCommandContext('CommandItem');
  const groupId = useContext(GroupContext);
  const id = `dsn-command-item-${useId()}`;
  const nodeRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const keywordKey = (keywords ?? []).join('\u0000');

  useLayoutEffect(
    () =>
      registerItem({
        id,
        value,
        keywords: keywordKey ? keywordKey.split('\u0000') : [],
        groupId,
        disabled,
        seq: 0,
        getNode: () => nodeRef.current,
        select: () => onSelectRef.current?.(value),
      }),
    [disabled, groupId, id, keywordKey, registerItem, value],
  );

  const isActive = activeId === id;

  return (
    <div
      ref={nodeRef}
      id={id}
      className={['dsn-command-item', className].filter(Boolean).join(' ')}
      role="option"
      aria-selected={isActive}
      aria-disabled={disabled || undefined}
      data-active={isActive || undefined}
      data-disabled={disabled || undefined}
      hidden={!isVisible(id)}
      style={{ order: getOrder(id) }}
      onMouseDown={(event) => event.preventDefault()}
      onPointerMove={() => {
        if (!disabled && !isActive) setActiveId(id);
      }}
      onClick={() => {
        if (!disabled) onSelectRef.current?.(value);
      }}
    >
      {leadingIcon != null && (
        <span className="dsn-command-item-icon" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <span className="dsn-command-item-text">
        <span className="dsn-command-item-label">{label ?? value}</span>
        {description && <span className="dsn-command-item-description">{description}</span>}
      </span>
      {shortcutLabel && (
        <span className="dsn-command-item-shortcut">
          <Shortcut label={shortcutLabel} aria-label={shortcutAriaLabel ?? shortcutLabel} />
        </span>
      )}
    </div>
  );
}

/** Divider between groups. Hidden while searching unless `alwaysRender`. */
export function CommandSeparator({ alwaysRender = false, className }: CommandSeparatorProps) {
  const { search } = useCommandContext('CommandSeparator');
  if (!alwaysRender && search.trim().length > 0) return null;
  return <div className={['dsn-command-separator', className].filter(Boolean).join(' ')} role="separator" />;
}

// ─── CommandDialog ────────────────────────────────────────────────────────────

/**
 * Command inside a focus-trapped Modal — the ⌘K palette. Opens with focus in the
 * search input; Escape or an outside click closes it and focus returns to the trigger.
 * The search resets each time it opens. Binding the ⌘K shortcut is the consumer's job.
 *
 * @aiSelectWhen A global ⌘K / Ctrl K palette or site-wide search
 *
 * @aiAvoid Do not use for a search field that filters content already on the page — use SearchBar instead
 * @aiAvoid Do not use to pick a form value — use Combobox instead
 *
 * @aiSpatial Portaled to document.body, pinned near the top of the viewport so the input does not jump as results change.
 *
 * @aiCompose Children are the same parts as Command: CommandInput, then CommandList
 * @aiCompose Never open from inside a Modal — modals never nest
 * @aiCompose Close the dialog in CommandItem.onSelect; the app binds ⌘K / Ctrl K to toggle it
 */
export function CommandDialog({
  open,
  defaultOpen,
  onOpenChange,
  'aria-label': ariaLabel = 'Command menu',
  className,
  children,
  ...commandProps
}: CommandDialogProps) {
  return (
    <Modal
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      showHeader={false}
      showBottomBar={false}
      aria-label={ariaLabel}
      className={['dsn-command-dialog', className].filter(Boolean).join(' ')}
    >
      <Command {...commandProps}>
        {children}
      </Command>
    </Modal>
  );
}

export default Command;
