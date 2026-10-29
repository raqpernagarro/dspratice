# Agent skills versioning report

**Date:** 2026-07-13  
**AGENTS.md version:** 1.0.1

---

## Summary

Agent command/skill definitions are now tracked in `skills/<command>/SKILL.md`. `.claude/commands/` is derived via `npm run sync:skills` (also runs on `npm install` via `prepare`).

---

## Tracked skills (6)

| Source | Runtime `name` |
|--------|----------------|
| `skills/ds-a11y-audit/SKILL.md` | `ds-a11y-patrol` |
| `skills/ds-component-doc/SKILL.md` | `ds-component-doc` |
| `skills/ds-doc-audit/SKILL.md` | `ds-doc-audit` |
| `skills/ds-patrol/SKILL.md` | `ds-patrol` |
| `skills/ds-session-recap/SKILL.md` | `ds-session-recap` |
| `skills/ds-token-sync/SKILL.md` | `ds-token-sync` |

---

## Tooling

| Script | Purpose |
|--------|---------|
| `npm run sync:skills` | Copy `skills/*/SKILL.md` → `.claude/commands/<command>.md` |
| `npm run check:skills` | Verify derived commands match tracked source |
| `prepare` | Auto-sync on `npm install` (fresh clone) |

CI: `check-skills` job in `.github/workflows/token-audit.yml`

---

## ds-a11y-patrol 2.5.7 verification

Tracked source and derived command both contain the corrected rule:

- Keyboard alternatives satisfy **2.1.1 only** — not 2.5.7 evidence
- Single-pointer non-drag path required for 2.5.7 pass

Verified via `rg "2\.5\.7"` on `skills/ds-a11y-audit/SKILL.md` and post-sync `.claude/commands/ds-a11y-audit.md` — content identical.

---

## Test status

Full suite: **992/992 passed**
