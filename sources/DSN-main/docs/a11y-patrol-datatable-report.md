# DS-Nagarro accessibility patrol — DataTable

**Date:** 2026-07-13  
**Scope:** DataTable column reorder (WCAG 2.1.1 + 2.5.7)  
**Patrol skill:** `skills/ds-a11y-audit/SKILL.md` (`name: ds-a11y-patrol`)

---

## Verdict

**Pass** — column reorder meets **2.1.1** and **2.5.7** under the corrected evaluation rule.

---

## WCAG criteria (evaluated separately)

| Criterion | Requirement | Evidence | Result |
|-----------|-------------|----------|--------|
| **2.1.1 Keyboard** | All functionality operable via keyboard | Ctrl/Cmd+ArrowLeft/ArrowRight on focused reorderable header | ✅ Pass |
| **2.5.7 Dragging movements** | Single-pointer alternative without dragging | Column options → Move left / Move right (click menu items) | ✅ Pass |
| **4.1.2 Name, Role, Value** | State and actions exposed | `aria-expanded`/`aria-haspopup` on options trigger; `menuitem` labels; live region announcement | ✅ Pass |

**Note:** Prior patrol incorrectly passed 2.5.7 on keyboard evidence alone. That evaluation is **invalid** under the corrected rule.

---

## Reorder paths (implementation)

| Path | Mechanism | WCAG role |
|------|-----------|-----------|
| Drag | Header root `draggable` | Optional enhancement |
| **Single-pointer** | Column options button → **Move left** / **Move right** | **2.5.7** |
| Keyboard | Ctrl/Cmd+Arrow on focused header | **2.1.1** |

Shared exclusions: locked first display column, `reorderable: false`. All successful moves announce via `role="status"` live region.

---

## Scope B — DataTable checklist

| Item | Result |
|------|--------|
| Table semantics | ✅ Pass |
| `aria-sort` on sortable columns | ✅ Pass |
| 2.5.7 non-drag pointer path | ✅ Pass (column options menu) |
| 2.1.1 keyboard path | ✅ Pass |
| Live region on reorder | ✅ Pass |

---

## Tests

- Keyboard reorder + announcement
- Column options menu click reorder + announcement
- Locked-column exclusion (keyboard + drag)
- `DataTableHeaderCell` menu and Ctrl+Arrow coverage

Full suite: **992/992 passed**
