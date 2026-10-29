# DS-Nagarro agent skills (versioned source)

Agent command/skill definitions for Claude Code and Cursor. **This directory is the source of truth.**

## Layout

```
skills/
  <command-name>/
    SKILL.md    ← edit this file
```

Each `SKILL.md` is a command definition with YAML frontmatter (`name`, `description`) followed by the skill body.

| Directory | Command file (derived) | Frontmatter `name` |
|-----------|------------------------|--------------------|
| `ds-a11y-audit/` | `.claude/commands/ds-a11y-audit.md` | `ds-a11y-patrol` |
| `ds-component-doc/` | `.claude/commands/ds-component-doc.md` | `ds-component-doc` |
| `ds-component-sync/` | `.claude/commands/ds-component-sync.md` | `ds-component-sync` |
| `ds-doc-audit/` | `.claude/commands/ds-doc-audit.md` | `ds-doc-audit` |
| `ds-figma-apply/` | `.claude/commands/ds-figma-apply.md` | `ds-figma-apply` |
| `ds-patrol/` | `.claude/commands/ds-patrol.md` | `ds-patrol` |
| `ds-session-recap/` | `.claude/commands/ds-session-recap.md` | `ds-session-recap` |
| `ds-token-sync/` | `.claude/commands/ds-token-sync.md` | `ds-token-sync` |

The **directory name** must match the derived command filename (without `.md`). The frontmatter `name` is the skill identifier used at runtime and may differ (e.g. `ds-a11y-patrol`).

## Workflow

1. Edit `skills/<command>/SKILL.md` — never edit `.claude/commands/` directly.
2. Run `npm run sync:skills` (also runs automatically on `npm install` via `prepare`).
3. Verify with `npm run check:skills`.

`.claude/` remains gitignored for local settings and worktrees; only `skills/` is tracked.
