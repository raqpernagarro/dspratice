# Separator

A separator is a thin visual divider that creates a clear boundary between two sections of content. It carries no interaction and communicates no semantic status — it is purely structural.

---

## When to use

Use a separator to **visually distinguish adjacent content sections** that are related but distinct enough to benefit from a clear boundary.

Typical uses:
- Dividing sections within a settings panel or form
- Separating groups of items in a menu or list
- Creating visual rhythm in a content layout with multiple distinct sections

**Do not use a separator when:**
- Adequate spacing alone is sufficient to distinguish sections — whitespace is preferable to a line
- The sections are already visually separated by background color, card borders, or other structural elements
- The purpose is decorative rather than structural

---

## Directions

| Value | Use |
|---|---|
| `Horizontal` | Divides content stacked vertically — the most common use. Spans the full width of its container. |
| `Vertical` | Divides content placed side by side. Spans the full height of its container. |

---

## Rules

- A separator takes up no semantic space in the content hierarchy — it is a visual aid, not a structural landmark.
- Do not use separators to compensate for poor spacing or layout decisions. Fix the spacing first.
- Separators should be consistent in weight and color within a layout — do not vary the separator style to imply different levels of separation; use spacing hierarchy for that instead.
- In menus and lists, separators group related items — place them between groups, not between every item.

---

## Accessibility

- Implement horizontal separators with `<hr>` for semantic meaning, or with `role="separator"` on a `<div>`.
- Purely decorative separators with no structural meaning should use `aria-hidden="true"`.
- Vertical separators used as visual spacers between inline elements are typically decorative — use `aria-hidden="true"`.
