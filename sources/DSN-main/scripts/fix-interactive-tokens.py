#!/usr/bin/env python3
"""
Fixes tokens.css:
1. Removes duplicate --color-background-interactive-* entries
2. Corrects dark mode --color-text-interactive-primary-* values
Run from DSN root: python3 scripts/fix-interactive-tokens.py
"""

PATH = 'tokens.css'

with open(PATH, 'r') as f:
    lines = f.readlines()

# Lines to remove (1-indexed from grep output, convert to 0-indexed)
# Duplicates in light mode: 288, 289
# Duplicates in dark mode: 869, 870
# Dark mode text corrections: 861, 862, 863 need value fixes

REMOVE_LINES = {288, 289, 869, 870}  # 1-indexed

# Dark mode text corrections (1-indexed line → new content)
FIX_LINES = {
    861: '    --color-text-interactive-primary-default:         var(--color-text-accent);\n',
    862: '    --color-text-interactive-primary-hover:           var(--primitive-accent-200);\n',
    863: '    --color-text-interactive-primary-pressed:         var(--primitive-accent-400);\n',
}

result = []
removed = 0
fixed = 0

for i, line in enumerate(lines):
    lineno = i + 1  # 1-indexed
    if lineno in REMOVE_LINES:
        removed += 1
        continue
    if lineno in FIX_LINES:
        result.append(FIX_LINES[lineno])
        fixed += 1
    else:
        result.append(line)

with open(PATH, 'w') as f:
    f.writelines(result)

print(f'  ✅ Removed {removed} duplicate lines')
print(f'  ✅ Fixed {fixed} dark mode text token values')
print('\n  Next: npm run sync:tokens && npm run audit:tokens')
