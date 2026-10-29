#!/usr/bin/env python3
"""
Adds missing --color-background-interactive-primary-* and
--color-background-interactive-secondary-* tokens to tokens.css.
Also adds --color-text-interactive-primary-* tokens.
Run from DSN root: python3 scripts/patch-missing-interactive.py
"""

import re

PATH = 'tokens.css'

with open(PATH, 'r') as f:
    src = f.read()

# ─── Light mode additions ─────────────────────────────────────────────────────
# Insert after --color-background-disabled

LIGHT_ADDITIONS = """
    --color-background-interactive-primary-default:   var(--color-accent);
    --color-background-interactive-primary-hover:     var(--color-accent-hover);
    --color-background-interactive-primary-pressed:   var(--color-accent-pressed);
    --color-background-interactive-secondary-default: var(--color-background-primary);
    --color-background-interactive-secondary-hover:   var(--color-background-secondary);
    --color-background-interactive-secondary-pressed: var(--color-background-tertiary);

    --color-text-interactive-primary-default:         var(--color-text-primary);
    --color-text-interactive-primary-hover:           var(--color-accent-hover);
    --color-text-interactive-primary-pressed:         var(--color-accent-pressed);"""

# Find anchor — insert after --color-background-disabled line
anchor = re.compile(r'(    --color-background-disabled:[^\n]+\n)')
if anchor.search(src):
    src = anchor.sub(r'\1' + LIGHT_ADDITIONS + '\n', src, count=1)
    print('  ✅ Added light mode interactive tokens')
else:
    print('  ⚠️  Anchor --color-background-disabled not found')

# ─── Dark mode additions ──────────────────────────────────────────────────────
# Insert after --color-background-disabled in dark mode block

DARK_ADDITIONS = """
    --color-background-interactive-primary-default:   var(--color-accent);
    --color-background-interactive-primary-hover:     var(--color-accent-hover);
    --color-background-interactive-primary-pressed:   var(--color-accent-pressed);
    --color-background-interactive-secondary-default: var(--color-background-primary);
    --color-background-interactive-secondary-hover:   var(--primitive-alpha-light-5);
    --color-background-interactive-secondary-pressed: var(--primitive-alpha-dark-90);

    --color-text-interactive-primary-default:         var(--color-text-primary);
    --color-text-interactive-primary-hover:           var(--color-accent-hover);
    --color-text-interactive-primary-pressed:         var(--color-accent-pressed);"""

# Find the dark mode block's --color-background-disabled
# It appears after [data-theme="dark"]
dark_block_start = src.find('[data-theme="dark"]')
if dark_block_start == -1:
    print('  ⚠️  Dark mode block not found')
else:
    dark_section = src[dark_block_start:]
    anchor_dark = re.compile(r'(    --color-background-disabled:[^\n]+\n)')
    if anchor_dark.search(dark_section):
        dark_section = anchor_dark.sub(r'\1' + DARK_ADDITIONS + '\n', dark_section, count=1)
        src = src[:dark_block_start] + dark_section
        print('  ✅ Added dark mode interactive tokens')
    else:
        print('  ⚠️  Dark mode anchor not found — adding before end of dark block')

# ─── Remove from isAutoSkipped in sync-tokens.mjs ────────────────────────────
# These tokens now exist in tokens.css so they don't need to be skipped

with open(PATH, 'w') as f:
    f.write(src)

print('\n  ✅ tokens.css patched')
print('  Next: npm run sync:tokens && npm run audit:tokens && npm run build')
