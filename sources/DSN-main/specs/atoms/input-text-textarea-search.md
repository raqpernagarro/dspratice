# Input / Search

A text input specifically for search and filter interactions. Optimized for quick, repeated use with clear entry and result feedback.

---

## When to use

Use Search input when the user is querying a dataset, filtering a list, or looking up records. It differs from a text input in that it is inherently transient — the value is a query, not a stored field.

---

## Types

### Search (bordered)
The standard search input with a full border. Use in dedicated search areas, filter panels, and anywhere search is a primary interaction.

States: Empty · Hover · Active · Filled · Focused · Error · Disabled

### Search borderless
A minimal search input with no border in its resting state. Use inline within toolbars, headers, or any context where a full bordered input would feel too heavy.

States: Empty · Hover · Typing · Filled · Unfilled Focused · Error · Disabled

Note: `Typing` is the Search borderless equivalent of `Active`. `Unfilled Focused` represents focus without a value — distinct from `Filled Focused` because the clear button is absent.

---

## Interaction

- Always include a clear (×) button when the field has a value — clearing search is a frequent action and must be one tap.
- Trigger search on Enter keystroke or after a debounce delay (300–500ms) as the user types — define this consistently per product context.
- Do not show an error state for "no results" — that is a results-level feedback, not an input error. Show empty state feedback in the results area instead.
- The `Error` state is reserved for system errors (e.g. search service unavailable), not for empty results.

## Content guidelines

- Placeholder: describes what can be searched. "Search members", "Search by name or email", "Search projects".
- Do not label a search input "Search" if the placeholder already communicates the scope — avoid redundancy.
- Clear button `aria-label`: "Clear search".
