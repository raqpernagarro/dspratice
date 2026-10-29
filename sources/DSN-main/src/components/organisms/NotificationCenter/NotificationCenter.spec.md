# NotificationCenter

**Tier:** organism
**Location:** `src/components/organisms/NotificationCenter/NotificationCenter.spec.md`
**Version:** 1.0.0

## What it is

A bell trigger with an unread count that opens an anchored panel listing the user's notifications. The panel has a header with "Mark all as read", an All / Unread filter, a scrollable list, and an optional "View all notifications" footer. It is composed from `Button`, `Badge`, `Avatar`, `SegmentControl`, `SkeletonLoading`, `EmptyState` and `PopoverWrapper`.

## When to use

- Use for a persistent inbox of events the user can review later: mentions, assignments, approvals, system events
- Use in the Navbar when the product needs a bell with an unread count

## When NOT to use

- Do not use to confirm the outcome of an action the user just took → use `Toast` instead
- Do not use for a notice about the current page or record → use `Callout` instead
- Do not use for decisions that block the user → use `Modal` or `AlertDialog` instead
- Do not use as a general-purpose menu of actions → use `PopoverMenu` instead

## Variant selection

`NotificationCenter` has no visual variants. Behaviour is configured by props:

| Prop | Use when |
|------|----------|
| `showFilter` (default `true`) | Keep on. Turn off only when the product never has more than a handful of notifications |
| `onMarkAllRead` | Pass whenever the app can mark items as read. "Mark all as read" is hidden when omitted and disabled at 0 unread |
| `onViewAll` | Pass when the app has a full notifications page; navigate there in the callback. Pressing it closes the panel and returns focus to the trigger. The footer is hidden when omitted |
| `loading` | `true` while the first page of notifications is fetched. Shows skeleton rows with `aria-busy` |

## Spatial contract

- **Owns its padding:** yes. The trigger is a `Button` (md, ghost, icon-only), and the panel slots own their padding.
- **Owns its margin:** no. Space it from siblings with a wrapper `gap` (e.g. in Navbar `rightActions`).
- **Fills its container:** no. The bell trigger is inline (none is rendered with an external `anchorRef`). The panel portals to `document.body` at `var(--popover-width-lg)` wide, clamped to the viewport minus `var(--space-md)` on each side. The list scrolls inside the panel.
- **Owns stacking:** yes. The panel uses the `PopoverWrapper` anchored, portaled, fixed-position contract (AGENTS.md Rule 10).

## Composition rules

- ✅ Place in: Navbar `rightActions`, to the left of the primary CTA
- ✅ Or open from: a Sidebar item, when Notifications lives in the Sidebar. Pass the item's `buttonRef` as `anchorRef` (no bell is rendered; the panel opens to the right of the item)
- ❌ Never wrap in: `PopoverMenu`, `PopoverWrapper` or another popover. It owns its anchored panel
- ❌ Never use with: a second bell or notification badge elsewhere in the same Navbar

## Data and state

- Data-driven: pass `notifications` (newest first). Never children.
- **The app owns read state.** The component never mutates `notifications`. Set `read: true` in response to `onNotificationClick` and `onMarkAllRead`.
- `timeLabel` is preformatted by the app (locale and relative time are app concerns). Pass `dateTime` (ISO) as well so `<time>` is machine-readable.
- `avatar`: a person uses `fill="initials"` or `fill="picture"` with `name`. A system event uses `fill="icon"` with a Lucide `icon`. When omitted, the row shows a neutral bell icon avatar.
- `open` / `filter` can be controlled (`onOpenChange`, `onFilterChange`) or left uncontrolled (`defaultOpen`, `defaultFilter`).

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `notifications` | `NotificationItem[]` | Always |
| `open` / `defaultOpen` / `onOpenChange` | `boolean` / `boolean` / `(open) => void` | Control the panel, e.g. to close it on route change |
| `filter` / `defaultFilter` / `onFilterChange` | `'all' \| 'unread'` | Persist the user's filter choice |
| `showFilter` | `boolean` | Default `true` |
| `onNotificationClick` | `(item) => void` | Navigate to the item and mark it read. The panel closes and focus returns to the bell |
| `onMarkAllRead` | `() => void` | Shows the header action |
| `onViewAll` | `() => void` | Shows the full-width footer action. Navigate in the callback; the panel closes itself |
| `loading` | `boolean` | First load only. Don't flash skeletons on refresh |
| `anchorRef` | `RefObject<HTMLElement>` | Open from your own trigger (Sidebar item `buttonRef`). Hides the bell; control `open` from the trigger |
| `id` | `string` | Panel id. Required with `anchorRef` so the trigger's `aria-controls` can point at it |
| `placement` | `'bottom' \| 'right'` | Defaults to `bottom` for the bell and `right` with `anchorRef`. `right` falls back below when there is no room |

## Opening from the Sidebar

When Notifications is a Sidebar item rather than a Navbar bell:

```tsx
const notificationsRef = useRef<HTMLButtonElement>(null);
const [open, setOpen] = useState(false);

// Sidebar item
{
  id: 'notifications', label: 'Notifications', icon: <Bell size={16} />,
  showBadge: unread > 0, badgeCount: unread, selected: open,
  buttonRef: notificationsRef,
  'aria-haspopup': 'dialog', 'aria-expanded': open,
  'aria-controls': open ? 'notifications-panel' : undefined,
  onClick: () => setOpen((v) => !v),
}

<NotificationCenter id="notifications-panel" anchorRef={notificationsRef}
  open={open} onOpenChange={setOpen} notifications={notifications} />
```

- The trigger owns the ARIA (`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`) and the unread `badgeCount`.
- Pointer-down on the trigger is not an outside click, so the item's own `onClick` toggles cleanly.
- Escape and row activation return focus to the Sidebar item.

## Accessibility

- The trigger's accessible name includes the count ("Notifications, 3 unread"). It sets `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` while open. The visual `Badge` is `aria-hidden`.
- The panel is `role="dialog"` named "Notifications". The list is a `<ul>` labelled by the panel heading.
- On open, focus moves to the first notification row. If there are no rows, it moves to the first focusable control in the panel.
- Arrow Up/Down move between rows (wrapping), and Home/End jump to the first or last row. Rows use a roving tabindex, so Tab moves header → filter → list → footer.
- Escape closes and returns focus to the bell. Outside click closes via `isPointerInsideAnchoredPopover` (portal-safe dismiss contract).
- Unread rows show a dot `Badge` **and** visually hidden "Unread" text, plus a heavier title weight. Colour is never the only signal.
- A polite live region announces increases in the unread count ("2 new notifications"). It stays silent on first render and when the count goes down.

## Common mistakes

1. **Mutating read state inside the component or expecting it to persist.** The app owns `read`. Update `notifications` in `onNotificationClick` / `onMarkAllRead`.
2. **Using it for action confirmations** ("Changes saved"). That's a `Toast`.
3. **Wrapping it in `PopoverMenu` or building a custom bell + popover.** Use `NotificationCenter` directly.
4. **Passing raw timestamps as `timeLabel`.** Format them in the app ("5 min ago", "Yesterday") and pass the ISO value in `dateTime`.
5. **Writing notification titles in title case or with "successfully".** Use sentence case and state the event: "Marco Rossi approved your access request".

## Examples

```tsx
<Navbar
  variant="title"
  title="Projects"
  rightActions={
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
      <NotificationCenter
        notifications={notifications}
        onNotificationClick={(n) => { markRead(n.id); navigate(n.href); }}
        onMarkAllRead={markAllRead}
        onViewAll={() => navigate('/notifications')}
      />
      <Button variant="primary">New project</Button>
    </div>
  }
/>
```

```tsx
// System event with an icon avatar
{
  id: 'deploy-1482',
  title: 'Deploy to staging finished',
  timeLabel: '1 h ago',
  dateTime: '2026-10-08T09:00:00Z',
  avatar: { fill: 'icon', icon: Rocket, name: 'Deployments' },
}
```
