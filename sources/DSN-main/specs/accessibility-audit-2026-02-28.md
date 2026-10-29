# DS-Ngr Accessibility Audit (2026-02-28)

## Scope
- Full component library audit (`atoms`, `molecules`, `organisms`).
- Automated Storybook a11y sweep in light and dark themes.
- Manual code-level audit for high-risk interactive components.

## Method
- Automated runs:
  - `npx @storybook/test-runner --url http://localhost:6008 --json --outputFile storybook-test-results.json`
  - `npx @storybook/test-runner --url "http://localhost:6008/?globals=theme:dark" --json --outputFile storybook-test-results-dark.json`
- Manual inspection of core interactive files, including:
  - `src/components/atoms/MenuCell/MenuCell.tsx`
  - `src/components/atoms/Select/Select.tsx`
  - `src/components/atoms/PhoneInput/PhoneInput.tsx`
  - `src/components/atoms/Checkbox/Checkbox.tsx`
  - `src/components/atoms/Radio/Radio.tsx`
  - `src/components/atoms/Switcher/Switcher.tsx`
  - `src/components/molecules/Slider/Slider.tsx`
  - `src/components/atoms/DateTimePicker/DateTimePicker.tsx`

## Component Inventory by Interaction Risk

### High risk
- Atoms: `AttachmentChip`, `Button`, `ButtonGroup`/`SplitButton`, `Checkbox`, `Chip`, `CustomViewTab`, `DateTimePicker`, `MenuCell`, `NumberInput`, `OTPInput`, `PasswordInput`, `PhoneInput`, `Radio`, `SearchBar`, `SegmentControl`, `Select`, `Switcher`, `Tab`, `TextArea`, `TextInput`, `UploadArea`
- Molecules: `CheckboxField`, `ChipField`, `ChoiceList`, `MultiChoice`, `PopoverWrapper`, `SingleChoice`, `Slider`, `Toast`, `Tooltip`, `Toolbar`
- Organisms: `PopoverMenu`

### Medium risk
- Atoms: `Attachment` (export/group container)

### Low risk
- Atoms: `Avatar`, `Badge`, `FileThumbnail`, `LoadingBar`, `ProgressBar`, `ProgressRing`, `SectionHeader`, `Separator`, `Shortcut`, `Tag`

## Automated Sweep Summary
- Storybook tests executed: `335`.
- Stories with a11y violations reported by addon-a11y: `70` (light) and `70` (dark).
- Dark-theme run produced the same flagged story set as light-theme run (no additional story-level outliers detected).

High-frequency flagged story groups:
- `Atoms/ProgressRing` + `Atoms/ProgressBar`: 8 stories
- `Navigation/Menu Cell`: 6 stories
- `Molecules/Choice List`: 5 stories
- `Form/DateTimePicker`: 6 stories
- `Atoms/CustomViewTab`: 4 stories
- `Atoms/Attachment/AttachmentChip`: 6 stories

Representative story links (debug panel):
- `http://localhost:6008/?path=/story/navigation-menu-cell--default&addonPanel=storybook/a11y/panel`
- `http://localhost:6008/?path=/story/molecules-choice-list--actions-menu&addonPanel=storybook/a11y/panel`
- `http://localhost:6008/?path=/story/form-datetimepicker--single-date&addonPanel=storybook/a11y/panel`
- `http://localhost:6008/?path=/story/form-select--disabled&addonPanel=storybook/a11y/panel`

## Deduplicated Violations Backlog

### Critical
1. **A11Y-001: Menu items are non-native interactive divs without keyboard activation**
   - Affected: `src/components/atoms/MenuCell/MenuCell.tsx` (+ all consumers).
   - Evidence: root is `<div role="menuitem">` with click handling, no Enter/Space key activation.
   - Impact: keyboard users cannot reliably activate menu items.
   - Fix direction: convert root to semantic `<button role="menuitem">` (or implement full keyboard handlers and focus model if div must remain).

### High
2. **A11Y-002: Select-like menus use incomplete ARIA menu behavior**
   - Affected: `src/components/atoms/Select/Select.tsx`, `src/components/atoms/PhoneInput/PhoneInput.tsx`, `src/components/organisms/PopoverMenu/PopoverMenu.tsx`, `src/components/molecules/ChoiceList/ChoiceList.tsx`.
   - Evidence: popup uses `role="menu"` with `MenuCell` items but lacks robust roving tabindex + arrow navigation pattern.
   - Impact: inconsistent keyboard navigation and SR expectations.
   - Fix direction: implement full menu pattern (arrow key roving focus, Enter/Space activation, Escape close, focus return) or migrate to `listbox/option` semantics where appropriate.

3. **A11Y-003: Disabled controls remain focusable**
   - Affected: `src/components/atoms/Switcher/Switcher.tsx`, `src/components/atoms/Chip/Chip.tsx`, `src/components/atoms/Checkbox/Checkbox.tsx`, `src/components/atoms/Radio/Radio.tsx`.
   - Evidence:
     - `Switcher` sets `tabIndex={0}` while disabled.
     - `Chip`, `Checkbox`, `Radio` keep tab stops with `aria-disabled` only.
   - Impact: violates expected keyboard model and project guideline (“disabled elements must not be focusable”).
   - Fix direction: remove from tab order when disabled (`tabIndex={-1}`), prefer native `disabled` controls where possible.

4. **A11Y-004: Nested interactive controls inside clickable composite rows**
   - Affected: `src/components/atoms/Checkbox/Checkbox.tsx`, `src/components/atoms/Radio/Radio.tsx`, `src/components/atoms/MenuCell/MenuCell.tsx`.
   - Evidence: root row is interactive and contains child `Button`/`Switcher` controls that can bubble activation to parent.
   - Impact: accidental double actions, unpredictable behavior for keyboard/SR users.
   - Fix direction: stop event propagation on nested controls and/or split parent/child interaction boundaries semantically.

### Medium
5. **A11Y-005: Date picker grid semantics mixed with per-cell tab stops**
   - Affected: `src/components/atoms/DateTimePicker/DateTimePicker.tsx`.
   - Evidence: each day is a tabbable `button role="gridcell"`; no single-tab-stop grid pattern.
   - Impact: excessive tab stops and inconsistent grid semantics.
   - Fix direction: roving tabindex with one active gridcell in tab order; arrow keys move active date.

6. **A11Y-006: Slider range input flow hijacks Tab**
   - Affected: `src/components/molecules/Slider/Slider.tsx`.
   - Evidence: `handleFirstRangeInputKeyDown` prevents default on forward Tab and manually moves focus.
   - Impact: unexpected keyboard behavior and potential assistive technology conflicts.
   - Fix direction: preserve native Tab order; optionally keep Enter-to-advance behavior only.

7. **A11Y-007: OTP focus styling uses `:focus` instead of `:focus-visible`**
   - Affected: `src/components/atoms/OTPInput/OTPInput.css`.
   - Evidence: `.dsn-otp-cell:focus { ... }`.
   - Impact: focus ring appears on pointer focus; inconsistent with DS focus policy.
   - Fix direction: move visible ring styling to `:focus-visible`.

### Low
8. **A11Y-008: Story-level disabled variants are frequent violation sources**
   - Affected story families: `Form/* Disabled`, `AttachmentChip` variants, `Section Header`, `Shortcut`.
   - Evidence: repeated addon-a11y warnings in disabled/demo-heavy stories.
   - Impact: noise in test output obscures critical regressions.
   - Fix direction: mark intentional non-interactive demo exceptions explicitly (if valid), and hard-fail only true regressions.

## Prioritized Fix Order
1. A11Y-001 (`MenuCell` semantics)  
2. A11Y-002 (menu/listbox keyboard model across `Select`/`PhoneInput`/`ChoiceList`/`PopoverMenu`)  
3. A11Y-003 (disabled focusability)  
4. A11Y-004 (nested interaction bubbling)  
5. A11Y-005 + A11Y-006 (DateTimePicker + Slider keyboard models)  
6. A11Y-007 (OTP focus-visible compliance)  
7. A11Y-008 (story-level noise cleanup)

## Ongoing Guardrails (Definition of Done)
- Add a PR checklist requiring:
  - keyboard-only path verification,
  - disabled state tab-order verification,
  - role/name/value verification for custom widgets,
  - focus-visible-only ring verification.
- For any new popup/dropdown:
  - include explicit keyboard contract test (Arrow keys, Enter/Space, Escape, focus return).
- For any custom role (`menuitem`, `checkbox`, `radio`, `switch`, `slider`, `tab`):
  - include one interaction test asserting expected key behavior.
- Keep automated Storybook a11y pass in CI for light and dark themes.
- Configure addon-a11y to fail on severe issues in CI once A11Y-001..A11Y-004 are resolved.

## Remediation Status Update (2026-02-28)
- **A11Y-001**: Resolved — `MenuCell` now has semantic keyboard activation behavior for all root variants and updated tests.
- **A11Y-002**: Resolved — `Select`, `PhoneInput`, `ChoiceList`, and `PopoverMenu` now share keyboard menu behavior (arrow navigation, Enter/Space, Escape, focus return) with coverage tests.
- **A11Y-003**: Resolved — disabled controls (`Switcher`, `Chip`, `Checkbox`, `Radio`) removed from tab order.
- **A11Y-004**: Resolved — nested controls in `MenuCell`, `Checkbox`, and `Radio` stop propagation to avoid parent accidental activation.
- **A11Y-005**: Resolved — `DateTimePicker` day grid now uses a single tabbable day with roving focus.
- **A11Y-006**: Resolved — `Slider` no longer intercepts `Tab` in range input flow.
- **A11Y-007**: Resolved — `OTPInput` visible ring moved from `:focus` to `:focus-visible`.
- **A11Y-008**: Partially resolved — disabled/demo stories now use scoped Storybook a11y opt-outs where intentional; remaining noisy stories should be triaged in follow-up cleanup.

## Residual Gaps
- This pass did not run screen-reader software sessions (VoiceOver/NVDA/JAWS) end-to-end.
- Color-contrast findings are story-level only because addon output is currently summarized without full rule payload in test output.
