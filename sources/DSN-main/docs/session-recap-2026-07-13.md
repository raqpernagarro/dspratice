# DS-Nagarro session recap — 2026-07-13

Arc: checklist audit → ds-index integrity → test triage (15 failures) → DataTable doc patch → keyboard reorder → WCAG 2.5.7 patrol correction + single-pointer path → skills versioning → process rules fold-in.

## Git status

```
On branch main (behind origin/main by 1 commit)

Modified: AGENTS.md, AI.md, AI-short.md, ds-index.json, DataTable*, CustomViewTab*,
          Accordion, ProgressRing tests, workflows, package.json, generate-index.mjs, .gitignore

Untracked: docs/, skills/, scripts/check-index.mjs, scripts/check-skills.mjs,
            scripts/sync-skills.mjs, CustomViewTab.spec.md
```

Suite at recap time: **992/992 passed** (`npm test`).

---

## Part 1 — What was fixed and learned

### 1. Checklist audit (`docs/checklist-audit.md`)

| What broke / gap found | Correct behaviour | Rule absorbed |
|------------------------|-------------------|---------------|
| No single checklist artifact for DS-Ngr vs designsystemchecklist.com | Write audit to `docs/` only; no drive-by fixes in audit sessions | Report opens with `git status`; read-only sessions state why suite was not run |
| Foundations gaps: responsive type, dark elevation ladder, easing family, icon naming | Flag as partial/gap with canonical file targets | Open items register (Figma-first decisions) |

### 2. ds-index integrity

| What broke | Correct behaviour | Rule absorbed |
|------------|-------------------|---------------|
| `ds-index.json` scanned all `export function` in component folders (76 rows, wrong set) | Index mirrors **value exports** from `src/index.ts` only (90 public components) | `AGENTS.md` — ds-index inclusion follows `src/index.ts`; `INTERNAL_SUB_COMPONENTS` excluded |
| No CI gate on index drift | `scripts/check-index.mjs` + `npm run check:index` in `token-audit.yml` | Enforcement is CI, not documentation |
| Internal exports (`PageSelector`, etc.) listed as public | Never appear in index despite co-located specs | `AGENTS.md` — internal sub-components never in index |

### 3. Test-suite triage (15 failures → 0)

| Cluster | Class | Introducing commit | Fix | Lesson |
|---------|-------|-------------------|-----|--------|
| Accordion (4) | Component regression | `de80d05` | `hidden={!isExpanded}` on region | Triage before feature work when main is red |
| ProgressRing (1) | Stale test | `36ae75f` | Indeterminate: no `aria-valuemin/max` | Verify introducing commit; don't assume pre-existing |
| CustomViewTab (1) | Stale test | `1b06448` | Delete on focused tab, not remove button | A11y test needs equivalent path, not deletion |
| DataTableCell (4) | Stale test | `158c448` | Query `.dsn-data-table-cell`, not `role="cell"` | DOM contract changed; update selector |
| DataTableHeaderCell + DataTable (6) | Stale test | `3f2c975` | Desc-first sort; drag reorder; no "Reorder column" button | Document deliberate contract in spec + AI.md |

**Process:** Red main suspends DoD for all sessions; triage jumps the queue. "Pre-existing" requires bisection proof.

### 4. DataTable doc patch

| Gap | Fix | Files |
|-----|-----|-------|
| Sort cycle, callback shape, drag-only reorder undocumented | Spec + AI.md consumer rules | `DataTable.spec.md` v1.1.0→1.2.0; `AI.md` v1.2.1→1.2.2 |
| CustomViewTab removal contract missing | Co-located spec + story wiring | `CustomViewTab.spec.md`; `CustomViewTab.stories.tsx` |

### 5. Keyboard reorder restoration (WCAG 2.1.1)

| Gap | Fix | Files |
|-----|-----|-------|
| Keyboard path removed in `3f2c975` | Ctrl/Cmd+Arrow on focused reorderable header; live region | `DataTable.tsx`, `DataTableHeaderCell.tsx` |
| `onReorderCommand` orphan | Re-wired | Same |

### 6. WCAG 2.5.7 patrol correction + single-pointer path

| Gap | Fix | Files |
|-----|-----|-------|
| Patrol passed 2.5.7 on keyboard evidence (invalid) | Skill rule: keyboard = 2.1.1 only | `skills/ds-a11y-audit/SKILL.md` |
| No single-pointer reorder | Column options → Move left / Move right | `DataTableHeaderCell.tsx` (PopoverWrapper + MenuCell) |
| Docs still said drag-only | Three paths documented | `DataTable.spec.md` v1.3.0; `AI.md` v1.2.4 |

### 7. Skills versioning

| Gap | Fix | Files |
|-----|-----|-------|
| `.claude/` gitignored; patrol rules machine-local | `skills/<command>/SKILL.md` + `sync-skills.mjs` + `prepare` | `skills/`, `scripts/sync-skills.mjs`, `check-skills.mjs` |
| Audit reports cited untracked paths | Reports now cite `skills/` | `docs/*-report.md` |

### 8. AGENTS.md process rules (this session)

Folded accumulated process rules into `AGENTS.md` v1.0.2 — [Agent process rules](../AGENTS.md#agent-process-rules).

---

## Part 2 — DS agent prompt (self-contained)

```
Update process documentation in AGENTS.md based on the DS-Nagarro work arc ending
2026-07-13. Rules below are already drafted in AGENTS.md v1.0.2 — verify completeness,
avoid duplication in Scripts and automation, and confirm co-located specs + skills/
reference the right canonical homes.

Process rules to enforce:

1. ds-index.json mirrors src/index.ts value exports only; check:index in CI;
   INTERNAL_SUB_COMPONENTS never indexed.
2. Red main suspends DoD; triage jumps the queue; pre-existing failure claims
   require bisection proof.
3. Read-only/audit reports state explicitly why npm test was not run.
4. Do not delete or invert stale accessibility tests without maintainer sign-off;
   equivalent replacement paths (Delete vs mouse-only X) count.
5. WCAG 2.5.7 requires single-pointer non-drag alternative; keyboard is 2.1.1 only
   (see skills/ds-a11y-audit/SKILL.md).
6. skills/ is versioned source; .claude/commands/ is derived via sync:skills.
7. Reports open with git status; DoD = full suite green.
8. Prefer userEvent over fireEvent in interaction tests.
9. Descriptive agent commit messages (why, not just what).
10. CSS_ONLY_EXCEPTIONS entries require divergence justification in audit-token-drift.
11. ds-doc-audit validates token values against tokens.css, not names only.
12. Duplicated rules: co-located spec is canonical; run ds-doc-audit after changes.

Component/consumer rules already landed in:
- AI.md v1.2.4 (DataTable reorder: drag, Column options, keyboard)
- DataTable.spec.md v1.3.0
- CustomViewTab.spec.md
```

---

## Part 3 — Open items register (maintainer decisions)

Do not resolve in agent sessions without explicit sign-off.

| Item | Context | Question for maintainer |
|------|---------|-------------------------|
| **PopoverMenu outside-click dismiss** | DataTable Column options uses `PopoverWrapper` + `isPointerInsideAnchoredPopover`. Does `mousedown` to drag another column header dismiss an open menu? Who owns the contract — `PopoverWrapper`, `DataTableHeaderCell`, or shared spec? | Define dismiss vs drag interaction; add test if gap confirmed |
| **Error-label token family** | Checklist audit flagged missing/error label tokens | Pending Figma check — create tokens or document alias chain |
| **ds-a11y-audit vs ds-a11y-patrol naming** | Directory `skills/ds-a11y-audit/`; frontmatter `name: ds-a11y-patrol`; command file `ds-a11y-audit.md` | Rename directory to match runtime name, or accept dual naming in README |
| **Dark elevation ladder** | Checklist: dark mode lacks per-level surface fills for z-axis | Figma-first: add tokens or document semantic mapping |
| **Easing family** | All `--motion-transition-*` use single `ease` | Figma-first: accelerated/decelerated tokens or document intentional single curve |
| **Responsive type ramp** | Checklist: no viewport-mapped type tokens | Figma-first: add breakpoint type scale or document fixed-scale intent |

---

## Files changed map (canonical homes)

| Domain | Canonical file |
|--------|----------------|
| Builder process rules | `AGENTS.md` |
| Consumer rules | `AI.md` → `AI-short.md` (derived) |
| DataTable contract | `src/components/organisms/DataTable/DataTable.spec.md` |
| CustomViewTab contract | `src/components/atoms/CustomViewTab/CustomViewTab.spec.md` |
| A11y patrol evaluation | `skills/ds-a11y-audit/SKILL.md` |
| Doc audit procedure | `skills/ds-doc-audit/SKILL.md` |
| Index generator | `scripts/generate-index.mjs` |
| Index CI gate | `scripts/check-index.mjs` |
| Skills sync | `scripts/sync-skills.mjs` |
| Checklist gap inventory | `docs/checklist-audit.md` |
