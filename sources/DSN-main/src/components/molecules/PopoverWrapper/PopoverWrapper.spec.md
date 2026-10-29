# PopoverWrapper

**Tier:** molecule
**Location:** `src/components/molecules/PopoverWrapper/PopoverWrapper.spec.md`
**Version:** 1.0.0

## What it is

Internal positioning and portal primitive for anchored overlay panels in DS-Ngr. `PopoverWrapper` measures a trigger, applies viewport-safe fixed placement, and renders the panel shell (header, segment, search, content, bottom bar slots).

## When to use

- **Library builders only** — compose `PopoverWrapper` when implementing a new anchored dropdown, listbox, or dialog panel inside the component library.
- Used internally by `Select`, `Combobox`, `PhoneInput`, `DateTimePicker`, `PromptInput` model selector, and `PopoverMenu` (via `anchorRef`).
- **App consumers of DS-Ngr must not import or mount `PopoverWrapper` directly** — use the public field or overlay components above.

## When NOT to use

- Do not use for hover-only hints → use `Tooltip` instead (no click trigger, no persistent panel).
- Do not use when the user needs a structured menu with sections, choice lists, and optional bottom bar → use `PopoverMenu` (menu content + behavior) rather than reassembling slots on raw `PopoverWrapper`.
- Do not use when the overlay must block the entire page → use `Modal` instead.
- Do not use for one-off absolute positioning in a new component → reuse this primitive and the contracts below.

## Variant selection

`PopoverWrapper` has no visual `variant` prop. Behavior is driven by:

- **`anchorRef` set** — anchored mode: fixed placement + portal to `document.body`.
- **`anchorRef` omitted** — inline mode: panel renders in the React tree where mounted (Storybook demos, non-anchored shells).

Set `role` (`menu` | `dialog` | `listbox` | `group`) to match the interactive content inside the panel.

## Spatial contract

- **Owns its padding:** yes — internal slot padding via `contentPadding` and slot wrappers; panel chrome is self-contained.
- **Owns its margin:** no — gap from the trigger is positioning (`offset`, default `var(--space-2xs)`), not margin on the wrapper element.
- **Fills its container:** no in anchored mode — width follows `width`, `matchAnchorWidth`, and `minWidth` (minimum `192px` per AGENTS.md Rule 10); height is content-driven.
- **Owns stacking:** yes in anchored mode — portaled panels use fixed positioning and an elevated z-index so they escape ancestor `overflow: hidden` and local stacking contexts.
- **Defers to parent:** trigger width when `matchAnchorWidth` is true; viewport clamping defers to `viewportMargin` (default `var(--space-md)`).

## Portal contract

When `anchorRef` is provided:

1. The panel renders through `createPortal(..., document.body)` — it is **not** a DOM descendant of the trigger subtree.
2. Placement uses `position: fixed` with top/left computed from the anchor's `getBoundingClientRect`, opening below by default and flipping above only when the content does not fit below **and** there is more room above. When it fits neither side, it opens on the roomier side. The panel never slides over its own trigger — it shrinks to fit the chosen side instead.
3. Max height is the smaller of `maxHeight ?? var(--popover-height-max)` and the space on the chosen side, applied inline. Only `.dsn-popover-wrapper-content` scrolls (`overscroll-behavior: contain`); header, segment, search and bottom bar stay pinned. `--popover-height-max` is css-only and still needs a matching Figma variable.
4. **Why portal:** AppShell, DataTable scroll regions, Drawer, and other `overflow: hidden` ancestors clip inline overlays; portaling keeps menus and pickers visible and interactive.

When `anchorRef` is omitted, the panel renders inline (no portal). Use only for demos or layouts where clipping is not a concern.

## Dismiss contract

Because anchored panels portal outside the trigger subtree, **outside-click detection MUST NOT rely on `anchorRoot.contains(event.target)` alone**. That check treats every portaled panel interaction as an outside click.

**Required pattern** for any component that opens an anchored `PopoverWrapper` and dismisses on document `mousedown`:

```typescript
import { isPointerInsideAnchoredPopover } from '../PopoverWrapper';

document.addEventListener('mousedown', (event) => {
  if (!isPointerInsideAnchoredPopover(event, rootRef.current, popoverId)) {
    setOpen(false);
  }
});
```

Rules:

- Pass the **`id` on `PopoverWrapper` root** — the same string as `popoverId` in the helper (e.g. `menuId`, `listboxId`, `countryMenuId`, `dialogId`).
- Do not put `id` only on an inner content `div` unless that inner node wraps the entire interactive surface including segment/header/bottomBar; prefer `id` on the wrapper root.
- `isPointerInsideAnchoredPopover` returns true when the target is inside `anchorRoot` **or** inside `document.getElementById(popoverId)`.

## Builder rules

- **MUST:** A bottom bar with a **single action** renders that action **full width**. `PopoverWrapper` enforces this: it counts the actions (`button`, `a[href]`, `[role="button"]`) in `bottomBar` and sets `data-single-action` on `.dsn-popover-wrapper-bottom-bar` when there is exactly one. CSS then stretches the action and every wrapper around it (Toolbar slots, ButtonGroup, plain divs), so consumer `justify-content` cannot shrink it. Two or more actions keep their normal layout. Never override this with `width: auto` or by aligning a lone action to one side.
- **MUST:** Any new component composing anchored `PopoverWrapper` MUST use `isPointerInsideAnchoredPopover` in its outside-click / dismiss handler. A bare `rootRef.contains(target)` check is always wrong for anchored popovers.
- **Dismiss mechanisms:** **Containment-based** (`anchorRoot.contains`, `popoverRef.contains`, or equivalent) on document/window `mousedown` or `focusout` — **must** use `isPointerInsideAnchoredPopover`. **Portal-safe** without the helper: Escape-only (`keydown`), controlled open state with no outside dismiss, blur on a non-portaled inline panel, or inline mode (`anchorRef` omitted).
- **Failure mode if ignored:** `mousedown` on portaled menu content runs the dismiss handler first, closing the panel before the item's `click` fires — mouse selection appears dead while keyboard Enter/Space still works, masking the bug in keyboard-only tests.
- **MUST:** Set `id` on `PopoverWrapper` to match the id passed to the dismiss helper.
- **MUST:** Reuse Rule 10 placement tokens — do not implement parallel popover math in consuming components.
- **MUST:** Never set `max-height` or `overflow` on popover content in a consuming component — `PopoverWrapper` owns both.
- **MUST:** Always move focus into anchored popovers with `focusWithoutScroll`.
- **MUST:** Always use `scrollIntoPopoverView` to reveal an option without focusing it (e.g. `Select` keeps the selected option in view while its search field holds focus).
- **MUST:** Never call `element.focus()` or `element.scrollIntoView()` directly on popover content — the panel is portaled to `document.body`, so both scroll the page, and focus is ignored while the panel is still being positioned.
- **MUST:** Always fill the search slot when a list has more than 10 items — `Select` does this automatically (`searchable` overrides it); `PopoverMenu` needs `showSearch` set explicitly.

Reference implementations: `Select`, `Combobox`, `PhoneInput`, `DateTimePicker`, `PromptInputModelSelector`, `Pagination`, `AttachmentChip`, `DataTableCell` (tag overflow).

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `anchorRef` | `RefObject<HTMLElement>` | Set for all production anchored menus/pickers; omit only for inline/demo shells. |
| `id` | `string` | **Required** when using document-level dismiss handlers — must match `popoverId` in `isPointerInsideAnchoredPopover`. |
| `role` | `'menu' \| 'dialog' \| 'listbox' \| 'group'` | Match the ARIA role of the primary interactive content. |
| `matchAnchorWidth` | `boolean` | Set `true` for select-like triggers that should match menu width (min `192px`). |
| `offset` | `number` | Override gap below trigger; default reads `var(--space-2xs)`. |
| `viewportMargin` | `number` | Override viewport safe inset; default reads `var(--space-md)`. |
| `minWidth` | `number` | Override minimum panel width; default `192`. |
| `maxHeight` | `number` | Height cap in px; default reads `var(--popover-height-max)`. Effective max-height is the smaller of this and the space on the chosen side. |
| `preferredPlacement` | `'auto' \| 'top' \| 'bottom' \| 'right'` | Default `auto` (below; flips up only when it does not fit below and above is roomier). `right` opens beside the anchor top-aligned — for Sidebar-item triggers — and falls back to `auto` when the panel does not fit to the right. |

## Common mistakes

1. **Using `rootRef.contains(target)` for outside-click on an anchored popover** — closes the panel on the first `mousedown` inside portaled content; breaks mouse selection. Use `isPointerInsideAnchoredPopover`.
2. **Putting `id` on an inner content node that does not wrap segment/header/bottomBar** — clicks on those slots count as outside the popover and dismiss prematurely. Put `id` on `PopoverWrapper` root.
3. **Mounting `PopoverWrapper` in consuming apps** — internal infrastructure; expose behavior through `Select`, `PopoverMenu`, etc.
4. **Nesting `PopoverMenu` inside another `PopoverWrapper`** — creates double shells and width clipping; pass `anchorRef` on `PopoverMenu` instead (see `specs/molecules/popover.md`).
5. **Setting `max-height` or `overflow` on content passed to the wrapper** — fights the inline cap and lets pinned slots scroll away. Leave both to `PopoverWrapper`.
6. **Calling `element.focus()` or `scrollIntoView()` on an option** — scrolls the page to the portal and fails on first open. Use `focusWithoutScroll` / `scrollIntoPopoverView`.

## Examples

```tsx
// Correct anchored dismiss wiring (library builder)
const menuId = `${fieldId}-menu`;

useEffect(() => {
  function handlePointerDown(event: MouseEvent) {
    if (!isPointerInsideAnchoredPopover(event, rootRef.current, menuId)) {
      setOpen(false);
    }
  }
  document.addEventListener('mousedown', handlePointerDown);
  return () => document.removeEventListener('mousedown', handlePointerDown);
}, []);

{isOpen && (
  <PopoverWrapper
    id={menuId}
    role="menu"
    anchorRef={triggerRef}
    matchAnchorWidth
    content={/* menu items */}
  />
)}
```
