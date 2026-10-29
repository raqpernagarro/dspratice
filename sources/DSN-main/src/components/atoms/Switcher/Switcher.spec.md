# Switcher

A switcher toggles a single setting between an on and off state. The change takes effect immediately — no confirmation step required.

---

## When to use

Use a switcher when a single binary setting can be turned on or off, and the effect is **immediate** — the system responds the moment the user interacts.

Common contexts: enabling or disabling a feature, turning notifications on or off, activating a preference in a settings panel.

**Do not use a switcher when:**
- The user needs to select from more than two states → use Radio or Select instead
- Multiple independent options can be selected → use Checkbox instead
- The change requires a confirmation step before taking effect → use Checkbox instead
- The context is a compact toolbar or formatting control → use Toggle button instead
- The user is choosing between views or modes in the UI → use Segment control or Tabs instead

---

## Switcher vs Checkbox vs Toggle button

These three components are the most commonly confused. The decision axis is **immediacy** and **context**.

| Component | Effect | Context |
|---|---|---|
| **Switcher** | Immediate — no confirmation | Settings, preferences, feature flags |
| **Checkbox** | Staged — requires confirmation | Forms, filters, multi-select lists |
| **Toggle button** | Immediate — no confirmation | Toolbars, compact icon-driven controls |

The functional difference between Switcher and Toggle button is **presentation and context**, not behavior. Both take effect immediately. Use Switcher when the control has a visible label and lives in a settings-like layout. Use Toggle button when the control is icon-only and lives in a toolbar.

---

## Sizes

| Value | Use |
|---|---|
| `md` | Default. Use in standard settings panels and forms. |
| `sm` | Dense layouts, or when paired with compact surrounding components. |

Use the same size consistently within a list or settings group. Never mix `md` and `sm` switchers in the same group.

---

## States

`Selected` and `Disabled` are independent boolean properties. All combinations are valid.

| State | Description |
|---|---|
| `Default` | Resting state. No user interaction. |
| `Hover` | Pointer is over the switcher. |
| `Pressed` | Switcher is actively being clicked or tapped. |
| `Focused` | Switcher has keyboard focus. Must be visually distinct from Default. |
| `Disabled` | Switcher is non-interactive. Current value (on or off) is preserved but cannot be changed. |

**On `Selected=True` + `Disabled=True`:** The switcher appears on but locked. Use when a setting is required by the system and cannot be overridden by the user. Always provide an explanation of why it is fixed — do not leave the user guessing.

**On `Selected=False` + `Disabled=True`:** The switcher appears off and locked. Use when a feature is unavailable in the user's current context (e.g. a capability their plan doesn't include, or a dependency that hasn't been configured). Always explain the reason.

---

## Placement

- A switcher should always be paired with a label that describes the setting it controls. Never use a switcher without a label.
- Place the label to the left of the switcher. The switcher itself sits at the trailing edge of the row.
- Group related switchers under a shared section heading. Avoid scattering individual switchers across unrelated parts of a screen.
- In a list of settings, maintain consistent vertical rhythm — use the same size and spacing throughout.
- Do not use a switcher as the primary call to action on a screen. It is a control for settings, not a trigger for flows.

---

## Interaction

- Clicking or tapping the switcher (or its associated label row) toggles the state immediately.
- The change takes effect at the moment of interaction — there is no submit or apply step.
- If the action triggered by the switcher has a noticeable delay (e.g. calling an API), show a loading indicator within or alongside the switcher while the operation completes. Do not leave the switcher in an ambiguous visual state.
- If toggling could have significant consequences (e.g. disabling a critical feature, affecting other users), consider adding a confirmation dialog before applying the change — but this is an exception, not the default pattern.
- Keyboard: `Space` toggles the focused switcher. `Tab` moves focus to the next focusable element.

---

## Accessibility

- Each switcher must have an associated visible label. If the label is visually present, link it via `for`/`id` or `aria-labelledby`. Never rely on an `aria-label` alone when a visible label exists.
- Use `role="switch"` with `aria-checked="true"` or `aria-checked="false"` to communicate state to assistive technologies.
- The `Focused` state must meet WCAG AA contrast requirements for focus indicators.
- If the switcher triggers a change with a brief processing delay, use `aria-busy="true"` on the control or an `aria-live` region to announce completion.
- `Disabled` switchers should remain in the reading order. Use `aria-disabled="true"` so screen reader users can still discover and understand the control even if they can't interact with it.
- Do not rely on color alone (green/grey) to communicate on/off state — the thumb position and any accompanying label change must also signal the state.

---

## Content guidelines

**Setting labels:**
- Describe the thing being controlled, not the action of switching: "Email notifications" not "Turn on email notifications".
- Be specific enough that the user knows exactly what will change when they toggle: "Weekly digest" is better than "Notifications".
- Use sentence case: "Auto-save drafts" not "Auto-Save Drafts".
- `label`/`showLabel` and `icon`/`showIcon` (Figma: `Label`, `Show label`, `Icon`, `Show icon`) render short content *inside the track* (e.g. "On"/"Off" or a moon icon). They are decorative — the accessible name still comes from the visible row label via `aria-labelledby`, or `aria-label`.
- Keep labels to one line. If more context is needed, add a secondary description line below — but keep the label itself concise.

**On/off labels:**
- The switcher's on/off state should be self-evident from the control's visual appearance. Avoid adding redundant "On" / "Off" text next to the switcher unless the context makes the default state ambiguous.
- If status text is needed (e.g. in a data-dense settings panel), use "Enabled" / "Disabled" rather than "On" / "Off" for clarity in professional contexts.

**Disabled state explanations:**
- Always explain why a switcher is disabled. Place the explanation as a secondary line below the label, or as a tooltip triggered by hovering the disabled control.
- Examples: "Available on Pro plan", "Requires email to be verified first", "Managed by your administrator".
