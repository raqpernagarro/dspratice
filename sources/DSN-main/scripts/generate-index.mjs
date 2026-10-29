#!/usr/bin/env node
/**
 * DS-Nagarro Index Generator
 *
 * Reads src/components/, tokens.css, AI.md, AGENTS.md, and
 * specs/patterns/README.md to produce ds-index.json at the repo root.
 *
 * Usage:  node scripts/generate-index.mjs
 * Exit 1: any required source file is missing.
 *
 * Component inventory source of truth: value exports in src/index.ts.
 * Directory scanning is used only to resolve paths/specs — never to decide inclusion.
 * Internal sub-components re-exported from index.ts are excluded via INTERNAL_SUB_COMPONENTS.
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { parseToken, VOCAB } from './lib/token-grammar.mjs';
import { createHash } from 'crypto';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readRequired(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) {
    console.error(`ERROR: Required file missing: ${rel}`);
    process.exit(1);
  }
  return readFileSync(abs, 'utf8');
}

function listDirs(abs) {
  try {
    return readdirSync(abs).filter(f => {
      try { return statSync(join(abs, f)).isDirectory(); } catch { return false; }
    });
  } catch {
    return [];
  }
}

// Find component .tsx files in a directory (excluding stories/tests/css),
// and the exported component name for each, via `export function Name(` or
// `export default Name;` / `export const Name`.
function discoverComponentFiles(dirAbs) {
  let files;
  try {
    files = readdirSync(dirAbs);
  } catch {
    return [];
  }

  const tsxFiles = files.filter(
    f => f.endsWith('.tsx') && !f.endsWith('.stories.tsx') && !f.endsWith('.test.tsx')
  );

  const found = [];
  for (const file of tsxFiles) {
    const src = readFileSync(join(dirAbs, file), 'utf8');
    const fnMatch = src.match(/export\s+function\s+([A-Z]\w*)\s*\(/);
    const constMatch = src.match(/export\s+const\s+([A-Z]\w*)\s*[:=]/);
    const exportName = fnMatch?.[1] ?? constMatch?.[1];
    if (exportName) {
      found.push({ file, exportName });
    }
  }

  return found;
}

// ─── Freshness signals ────────────────────────────────────────────────────────

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    return null;
  }
}

function listTsxFilesRecursive(dirAbs) {
  let results = [];
  let entries;
  try {
    entries = readdirSync(dirAbs);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const abs = join(dirAbs, entry);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      results = results.concat(listTsxFilesRecursive(abs));
    } else if (entry.endsWith('.tsx')) {
      results.push(abs);
    }
  }

  return results;
}

function getComponentsHash() {
  const componentsRoot = join(ROOT, 'src/components');
  const files = listTsxFilesRecursive(componentsRoot)
    .map(abs => relative(ROOT, abs))
    .sort();
  const joined = files.join('\n');
  return createHash('sha1').update(joined).digest('hex').slice(0, 8);
}

function getTokensHash(tokensCss) {
  return createHash('sha1').update(tokensCss).digest('hex').slice(0, 8);
}

// ─── Token extraction ─────────────────────────────────────────────────────────

// Layers come from the grammar parser (Design Tokens/vocabulary.json):
// primitive-* is Layer 1, a component name is Layer 3, a tier is Layer 2.
function extractTokens(css) {
  const primitives = [];
  const semantics = [];
  const component = [];

  for (const line of css.split('\n')) {
    const m = line.match(/^\s*(--[\w-]+)\s*:/);
    if (!m) continue;
    const name = m[1];
    const { layer } = parseToken(name);
    if (layer === 'primitive') primitives.push(name);
    else if (layer === 'component') component.push(name);
    else semantics.push(name);
  }

  return {
    primitives: Array.from(new Set(primitives)),
    semantics: Array.from(new Set(semantics)),
    component: Array.from(new Set(component)),
  };
}

/**
 * Handbook I3: a regular grammar implies a complete grid, so list the holes.
 *  - ladder families: every missing step from one below the smallest to one above the largest
 *  - color roles: the other prominence of the role's kind, within the same aspect
 *  - interactive families: default / hover / active together
 */
function computeAbsences(semantics) {
  const names = new Set(semantics);
  const out = new Set();
  const LADDER = VOCAB.ladder.steps.filter(s => s !== 'none' && s !== 'full');

  const families = new Map();
  for (const n of semantics) {
    const m = n.match(/^(--.+)-([a-z0-9]+)$/);
    if (m && LADDER.includes(m[2])) (families.get(m[1]) ?? families.set(m[1], []).get(m[1])).push(LADDER.indexOf(m[2]));
  }
  // One step past each end too: the neighbours (body-lg, radius-2xl) are what agents guess.
  for (const [family, idx] of families) {
    for (let i = Math.max(0, Math.min(...idx) - 1); i <= Math.min(LADDER.length - 1, Math.max(...idx) + 1); i++) {
      if (!names.has(`${family}-${LADDER[i]}`)) out.add(`${family}-${LADDER[i]}`);
    }
  }

  const C = VOCAB.tiers.color;
  for (const aspect of ['background', 'foreground', 'border']) {
    for (const [role, kind] of Object.entries(C.prominenceByRole)) {
      if (kind === 'interactive') continue;
      const prefix = `--color-${aspect}-${role}`;
      const present = C.prominence[kind].filter(p => semantics.some(n => n === `${prefix}-${p}` || n.startsWith(`${prefix}-${p}-`)));
      if (!present.length) continue;
      for (const p of C.prominence[kind]) if (!present.includes(p)) out.add(`${prefix}-${p}`);
    }
  }

  for (const n of semantics) {
    const m = n.match(/^(--color-[a-z]+-[a-z-]+?)-(default|hover|active)$/);
    if (!m) continue;
    for (const st of ['default', 'hover', 'active']) if (!names.has(`${m[1]}-${st}`)) out.add(`${m[1]}-${st}`);
  }

  return [...out].sort().map(n => `${n} does not exist`);
}

function extractTokenFamilies(css) {
  const families = new Set();

  for (const line of css.split('\n')) {
    const m = line.match(/^\s*--([\w-]+)\s*:/);
    if (!m) continue;
    const segments = m[1].split('-');
    const prefix = `--${segments.slice(0, 2).join('-')}-*`;
    families.add(prefix);
  }

  return Array.from(families);
}

// ─── Rules extraction from AI.md ──────────────────────────────────────────────

function extractRules() {
  // Canonical hard rules for the DS index UI and agent quick-reference.
  // Keep in sync with AI.md when these constraints change.
  return {
    appshell_padding:
      'AppShell main area has built-in padding. Never add a wrapper with padding inside it.',
    datatable_card: 'Never wrap DataTable in a Card.',
    lucide:
      'Icons come from lucide-react; ds-ngr does not re-export them. Consuming apps list lucide-react at the same version ds-ngr uses.',
    token_chain:
      'Three layers: --primitive-* (raw values, tokens.css only) → semantic tiers (components and apps) → --<component>-* (that component only). Never use primitive or another component\'s tokens. Never hardcode hex.',
    page_margin:
      'All horizontal container spacing must use var(--space-md). Never hardcode padding-left or padding-right.',
    forms:
      "Every field is mandatory by default. Never use asterisks. Mark optional fields only with an 'Optional' label in var(--color-foreground-neutral-tertiary).",
    submit_cta:
      'Primary submit CTA must be disabled until all mandatory fields have a value. Always include the Shortcut component showing ⌘↵.',
    sentence_case:
      'Sentence case everywhere — all labels, headings, actions, messages.',
    icons: 'Only lucide-react icons permitted. No other icon libraries, no emoji as icons.',
    spacing_overrides:
      'Never add spacing overrides directly on DS component elements. Apply space-* tokens to wrapper/container elements only.',
    breakpoints:
      'CSS custom properties cannot be used inside @media queries. Always use raw px values for breakpoints.',
    disabled_state:
      'Never use opacity for disabled state. Use explicit disabled tokens.',
    focus: 'Always :focus-visible, never :focus.',
    state_prop:
      'State is never a prop. Use CSS pseudo-classes and boolean props only.',
    fabricated_tokens:
      'Never write a token you have not seen in tokens.names — a grammatical name is not proof it exists (see tokens.absences). Every word comes from Design Tokens/vocabulary.json.',
    popover_positioning:
      'Popovers open below the trigger and flip above only when the content does not fit below and there is more room above; when it fits neither side they use the roomier side. They never overlap their trigger. Height is capped at the smaller of --popover-height-max and the space on the chosen side; only the content area scrolls. Never set max-height or overflow on popover content — PopoverWrapper owns both.',
    popover_search:
      'Always show a search field when a popover list has more than 10 items. Select does this automatically (searchable overrides it); PopoverMenu needs showSearch. Never pass searchable={false} to a Select with more than 10 options — use Combobox for free-text or async option sets.',
  };
}

// ─── Relationships extraction from patterns README ────────────────────────────

function extractRelationships(readmeMd) {
  // Extract the relationship map section as-is, plus shared component rules.
  const shared = {
    SectionHeader: {
      rule: 'Always use organism built-in props — never mount manually inside Card/Modal/Drawer content.',
      usageMap: {
        'AppShell main area (page title)': '<SectionHeader title="..." size="large" /> — direct child',
        'AppShell main area (section divider)': '<SectionHeader title="..." size="medium" /> — direct child',
        'Inside Card': 'Via Card props: title, headerSize, headerLeadingControl, headerTrailingControl',
        'Inside Modal': 'Via Modal props: title, headerSize',
        'Inside Drawer': 'Via Drawer props: title',
      },
    },
    Toolbar: {
      rule: 'Always use organism built-in props — never mount manually inside Card/Modal/Drawer content.',
      usageMap: {
        'Above DataTable (filter bar)': 'Standalone — <Toolbar variant="filter-bar" leftActions={...} />',
        'Inside Card (bottom bar)': 'Via Card props: bottomBarLeftActions, bottomBarRightActions',
        'Inside Modal (bottom bar)': 'Via Modal props: bottomBarLeftActions, bottomBarRightActions',
        'Inside Drawer (bottom bar)': 'Via Drawer props: bottomBarLeftActions, bottomBarRightActions',
      },
    },
  };

  const compositionTree = {
    AppShell: {
      contains: ['Sidebar', 'Navbar'],
      mainArea: [
        'SectionHeader',
        'Toolbar',
        'DataTable',
        'BulkActionBar',
        'Card',
        'Modal',
        'Drawer',
      ],
    },
    Sidebar: { contains: ['SidebarMenuSelector', 'SectionHeader', 'Separator'] },
    SidebarMenuSelector: { contains: ['Avatar', 'Badge'] },
    Navbar: { contains: ['Button', 'Avatar', 'Badge'] },
    DataTable: { contains: ['DataTableHeaderCell', 'DataTableCell', 'Checkbox', 'Pagination'] },
    BulkActionBar: { contains: ['Button', 'ButtonGroup'] },
    Card: {
      contains: ['SectionHeader', 'Toolbar', 'SkeletonLoading'],
      note: 'SectionHeader and Toolbar rendered via props, not mounted in children',
    },
    Modal: {
      contains: ['SectionHeader', 'Toolbar', 'Button'],
      note: 'SectionHeader and Toolbar rendered via props, not mounted in children',
    },
    Drawer: {
      contains: ['SectionHeader', 'Toolbar', 'DataListCell'],
      note: 'SectionHeader and Toolbar rendered via props, not mounted in children',
    },
    Toolbar: { contains: ['Button', 'Checkbox'] },
    MediaViewer: {
      contains: ['Avatar', 'Tag', 'ButtonGroup', 'Button', 'FileThumbnail'],
      note: 'Top bar is built from item metadata and the actions render prop, not children',
    },
    CommandDialog: {
      contains: ['Modal', 'Command'],
      note: 'Modal with header and bottom bar removed; never wrap Command in Modal yourself',
    },
    NotificationCenter: {
      contains: ['Button', 'Badge', 'Avatar', 'SegmentControl', 'SkeletonLoading', 'EmptyState'],
      note: 'Data-driven via notifications prop; panel portals through PopoverWrapper — never wrap in PopoverMenu',
    },
  };

  const exclusionRules = [
    'DataTable is never wrapped in Card — DataTable is always full-width; Card clips and re-pads it',
    'AppShell main area never gets a padding wrapper — AppShell already applies var(--space-md)',
    'Icons always from lucide-react, listed at the same version ds-ngr uses',
    'SectionHeader never inside a padded parent — it is edge-to-edge and owns its own padding-inline',
    'Primary CTA always in Navbar rightActions — never inside Card, content area, or floating',
    'DataListCell stacks in Drawer — stack directly in .dsn-drawer-content; cells use --space-md inset to match header',
  ];

  return { sharedComponents: shared, compositionTree, exclusionRules };
}

// ─── Component catalogue ──────────────────────────────────────────────────────

// Curated metadata that cannot be reliably derived from source alone.
// Keys match the directory names under src/components/{tier}/.
// variants / sizes / booleanProps here are a fallback only: when typescript is
// installed they are derived from each component's props type (see propFields).
const COMPONENT_META = {
  // Atoms
  Button: {
    export: 'Button',
    variants: ['primary', 'secondary', 'ghost', 'plain'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled', 'loading', 'selected'],
    tokens: [
      '--color-background-interactive-primary-default',
      '--color-foreground-inverse-primary',
      '--font-size-body-md',
    ],
  },
  ButtonGroup: {
    export: 'ButtonGroup',
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-border-neutral-primary'],
  },
  Avatar: {
    export: 'Avatar',
    variants: ['profile', 'organization'],
    sizes: ['xxs', 'xs', 'sm', 'lg', 'xl', 'xxl'],
    booleanProps: [],
    tokens: ['--avatar-background', '--color-foreground-neutral-primary'],
  },
  Badge: {
    export: 'Badge',
    variants: ['highlight-soft', 'highlight-strong', 'informative', 'inverted', 'critical'],
    sizes: ['sm', 'md'],
    booleanProps: [],
    tokens: ['--tag-background-progress', '--color-foreground-interactive-primary-hover'],
  },
  Tag: {
    export: 'Tag',
    variants: ['highlight', 'warning', 'error', 'success', 'neutral'],
    sizes: ['sm', 'md'],
    booleanProps: ['removable'],
    tokens: ['--tag-background-neutral', '--color-foreground-neutral-primary'],
  },
  Chip: {
    export: 'Chip',
    variants: ['default', 'selected'],
    sizes: ['sm', 'md'],
    booleanProps: ['selected', 'disabled'],
    tokens: ['--color-background-neutral-primary', '--color-background-interactive-secondary-selected'],
  },
  Carousel: {
    export: 'Carousel',
    variants: [],
    sizes: [],
    booleanProps: ['showCounter', 'showDots', 'showThumbnails'],
    tokens: [
      '--color-background-inverse-primary',
      '--color-foreground-inverse-primary',
      '--color-border-interactive-primary-selected',
      '--motion-transition-normal',
    ],
  },
  AspectRatio: {
    export: 'AspectRatio',
    variants: ['1:1', '4:3', '3:2', '16:9', '21:9', '3:4', '9:16'],
    sizes: [],
    booleanProps: [],
    tokens: ['--shape-radius-md'],
  },
  Separator: {
    export: 'Separator',
    variants: ['horizontal', 'vertical'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-border-neutral-primary'],
  },
  Switcher: {
    export: 'Switcher',
    variants: ['default'],
    sizes: ['sm', 'md'],
    booleanProps: ['checked', 'disabled'],
    tokens: [
      '--toggle-background-off',
      '--toggle-background-on',
      '--switcher-shadow-thumb',
    ],
  },
  Checkbox: {
    export: 'Checkbox',
    variants: ['default'],
    sizes: ['sm', 'md'],
    booleanProps: ['checked', 'indeterminate', 'disabled'],
    tokens: ['--toggle-background-on', '--color-border-interactive-hover'],
  },
  Radio: {
    export: 'Radio',
    variants: ['default'],
    sizes: ['sm', 'md'],
    booleanProps: ['checked', 'disabled'],
    tokens: ['--toggle-background-on', '--color-border-interactive-hover'],
  },
  Tab: {
    export: 'Tab',
    variants: ['default', 'selected'],
    sizes: [],
    booleanProps: ['selected', 'disabled'],
    tokens: ['--color-foreground-neutral-primary', '--color-border-interactive-primary-selected'],
  },
  SegmentControl: {
    export: 'SegmentControl',
    variants: ['default'],
    sizes: ['sm', 'md'],
    booleanProps: [],
    tokens: ['--color-background-elevated', '--color-foreground-neutral-primary'],
  },
  Pagination: {
    export: 'Pagination',
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-foreground-neutral-primary', '--color-border-neutral-primary'],
  },
  SectionHeader: {
    export: 'SectionHeader',
    variants: ['large', 'medium', 'small'],
    sizes: [],
    booleanProps: ['flush'],
    tokens: ['--color-foreground-neutral-primary', '--font-size-body-sm', '--font-size-display-sm'],
  },
  DataListCell: {
    export: 'DataListCell',
    variants: ['with-title', 'just-icon'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-foreground-neutral-primary', '--color-foreground-neutral-secondary', '--color-border-neutral-primary'],
  },
  TextInput: {
    export: 'TextInput',
    variants: ['default'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled', 'readOnly', 'error'],
    tokens: [
      '--input-background-default',
      '--color-border-interactive-hover',
      '--color-foreground-neutral-primary',
    ],
  },
  TextArea: {
    export: 'TextArea',
    variants: ['default'],
    sizes: [],
    booleanProps: ['disabled', 'readOnly', 'error'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  SearchBar: {
    export: 'SearchBar',
    variants: ['default', 'ghost'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  Select: {
    export: 'Select',
    variants: ['default'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled', 'error'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  Slider: {
    export: 'Slider',
    variants: ['default', 'range'],
    sizes: [],
    booleanProps: ['disabled'],
    tokens: ['--color-background-neutral-secondary', '--color-background-accent-strong-default'],
  },
  UploadArea: {
    export: 'UploadArea',
    variants: ['default'],
    sizes: [],
    booleanProps: ['disabled'],
    tokens: ['--color-border-interactive-hover', '--input-background-default'],
  },
  DateTimePicker: {
    export: 'DateTimePicker',
    variants: ['date', 'time', 'datetime'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled', 'error'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  NumberInput: {
    export: 'NumberInput',
    variants: ['default'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled', 'error'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  PasswordInput: {
    export: 'PasswordInput',
    variants: ['default'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled', 'error'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  OTPInput: {
    export: 'OTPInput',
    variants: ['default'],
    sizes: [],
    booleanProps: ['disabled', 'error'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  PhoneInput: {
    export: 'PhoneInput',
    variants: ['default'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled', 'error'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  SkeletonLoading: {
    export: 'SkeletonLoading',
    variants: ['text', 'circle', 'rect'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-interactive-disabled'],
  },
  ProgressBar: {
    export: 'ProgressBar',
    variants: ['default', 'success', 'warning', 'danger'],
    sizes: ['sm', 'md'],
    booleanProps: [],
    tokens: ['--color-background-accent-strong-default', '--color-background-neutral-secondary'],
  },
  ProgressRing: {
    export: 'ProgressRing',
    variants: ['default', 'success', 'warning', 'danger'],
    sizes: ['sm', 'md', 'lg'],
    booleanProps: [],
    tokens: ['--color-background-accent-strong-default', '--color-border-neutral-primary'],
  },
  LoadingBar: {
    export: 'LoadingBar',
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-interactive-primary-default'],
  },
  Shortcut: {
    export: 'Shortcut',
    variants: ['default'],
    sizes: ['sm', 'md'],
    booleanProps: [],
    tokens: ['--color-background-neutral-secondary', '--color-foreground-neutral-secondary', '--font-size-micro'],
  },
  Stat: {
    export: 'Stat',
    variants: ['default', 'card'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-foreground-neutral-primary', '--font-size-display-sm', '--color-foreground-neutral-tertiary'],
  },
  CustomViewTab: {
    export: 'CustomViewTab',
    variants: ['default', 'selected'],
    sizes: [],
    booleanProps: ['selected'],
    tokens: ['--color-foreground-neutral-primary', '--color-border-interactive-primary-selected'],
  },
  DataTableCell: {
    export: 'DataTableCell',
    variants: ['default', 'hover'],
    sizes: [],
    booleanProps: ['loading', 'revealActionsOnHover'],
    tokens: ['--color-foreground-neutral-primary', '--color-border-neutral-primary'],
  },
  DataTableHeaderCell: {
    export: 'DataTableHeaderCell',
    variants: ['title', 'checkbox'],
    sizes: [],
    booleanProps: ['sortable', 'sorted'],
    tokens: ['--color-foreground-neutral-secondary', '--color-border-neutral-primary'],
  },
  MenuCell: {
    export: 'MenuCell',
    variants: ['default', 'switcher'],
    sizes: [],
    booleanProps: ['disabled'],
    tokens: ['--color-foreground-neutral-primary', '--color-foreground-interactive-destructive-default'],
  },
  FileThumbnail: {
    export: 'FileThumbnail',
    variants: ['image', 'pdf', 'doc', 'xls', 'generic'],
    sizes: ['sm', 'md', 'lg'],
    booleanProps: [],
    tokens: ['--avatar-background'],
  },
  Attachment: {
    export: 'Attachment',
    variants: ['default'],
    sizes: [],
    booleanProps: ['removable'],
    tokens: ['--color-border-neutral-primary', '--color-foreground-neutral-primary'],
  },
  Combobox: {
    export: 'Combobox',
    variants: ['default'],
    sizes: [],
    booleanProps: ['disabled', 'error', 'optional', 'showClearButton', 'showHelper', 'showLabel'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  // Molecules
  Breadcrumbs: {
    export: 'Breadcrumbs',
    variants: ['default', 'back'],
    sizes: ['sm', 'lg'],
    booleanProps: [],
    tokens: ['--color-foreground-neutral-secondary', '--color-foreground-neutral-primary'],
  },
  Toast: {
    export: 'Toast',
    variants: ['inline', 'rich'],
    sizes: [],
    booleanProps: [],
    tokens: ['--tag-background-neutral', '--color-foreground-neutral-primary'],
  },
  Tooltip: {
    export: 'Tooltip',
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-inverse-primary', '--color-foreground-inverse-primary'],
  },
  PopoverWrapper: {
    export: 'PopoverWrapper',
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-elevated', '--color-shadow-default'],
  },
  PopoverMenu: {
    export: 'PopoverMenu',
    variants: ['rich', 'simple'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-elevated', '--color-border-neutral-primary'],
  },
  EmptyState: {
    export: 'EmptyState',
    variants: ['default', 'search', 'error'],
    sizes: ['default', 'small'],
    booleanProps: ['hasIcon'],
    tokens: ['--color-foreground-neutral-secondary', '--color-foreground-neutral-primary'],
  },
  Toolbar: {
    export: 'Toolbar',
    variants: ['default', 'filter-bar', 'plain'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-border-neutral-primary', '--color-background-neutral-primary'],
  },
  BulkActionBar: {
    export: 'BulkActionBar',
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-neutral-primary', '--color-shadow-default'],
  },
  Callout: {
    export: 'Callout',
    variants: ['info', 'success', 'warning', 'danger'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-neutral-primary', '--color-foreground-neutral-primary'],
  },
  Form: {
    export: 'Form',
    variants: [],
    sizes: [],
    booleanProps: ['disableSubmitUntilValid', 'disabled', 'noValidate'],
    tokens: ['--space-md'],
  },
  Fieldset: {
    export: 'Fieldset',
    variants: [],
    sizes: [],
    booleanProps: ['optional', 'disabled'],
    tokens: [
      '--color-foreground-neutral-primary',
      '--color-foreground-neutral-tertiary',
      '--color-foreground-neutral-secondary',
      '--font-size-label',
      '--font-weight-medium',
      '--font-line-height-label',
      '--font-size-body-sm',
      '--font-line-height-body-sm',
      '--space-xs',
      '--space-md',
    ],
  },
  SidebarMenuSelector: {
    export: 'SidebarMenuSelector',
    variants: ['full', 'icon'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-foreground-neutral-primary', '--color-foreground-interactive-primary-selected'],
  },
  ChipField: {
    export: 'ChipField',
    variants: ['default'],
    sizes: [],
    booleanProps: ['disabled', 'error'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  CheckboxField: {
    export: 'CheckboxField',
    variants: ['default'],
    sizes: [],
    booleanProps: ['disabled', 'error'],
    tokens: ['--color-foreground-neutral-primary', '--color-foreground-neutral-secondary'],
  },
  HorizontalInput: {
    export: 'HorizontalInput',
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-foreground-neutral-primary', '--color-foreground-neutral-secondary'],
  },
  MultiChoice: {
    export: 'MultiChoice',
    variants: ['default'],
    sizes: [],
    booleanProps: ['disabled'],
    tokens: ['--toggle-background-on', '--color-border-interactive-hover'],
  },
  SingleChoice: {
    export: 'SingleChoice',
    variants: ['default'],
    sizes: [],
    booleanProps: ['disabled'],
    tokens: ['--toggle-background-on', '--color-border-interactive-hover'],
  },
  ChoiceList: {
    export: 'ChoiceList',
    variants: ['single', 'multi'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-neutral-primary', '--color-border-interactive-hover'],
  },
  RichTextEditor: {
    export: 'RichTextEditor',
    variants: ['default'],
    sizes: [],
    booleanProps: ['disabled', 'readOnly'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  PromptInput: {
    export: 'PromptInput',
    variants: ['default'],
    sizes: [],
    booleanProps: ['disabled', 'loading'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  Accordion: {
    export: 'Accordion',
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-border-neutral-primary', '--color-foreground-neutral-primary'],
  },
  // Organisms
  AppShell: {
    export: 'AppShell',
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-neutral-primary', '--color-background-neutral-primary', '--color-border-neutral-primary'],
    notes:
      'Root layout organism. Always lives inside <div style={{ height: "100vh", display: "flex" }}>. Never add height directly to AppShell.',
  },
  Navbar: {
    export: 'Navbar',
    variants: ['title', 'breadcrumbs'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-neutral-primary', '--color-foreground-neutral-primary', '--font-size-body-md'],
  },
  Sidebar: {
    export: 'Sidebar',
    variants: ['default'],
    sizes: [],
    booleanProps: ['collapsed'],
    tokens: ['--color-background-neutral-primary', '--sidebar-width-expanded-min'],
  },
  Card: {
    export: 'Card',
    variants: ['default'],
    sizes: [],
    booleanProps: ['showHeader', 'showBottomBar', 'loading'],
    tokens: ['--color-background-neutral-primary', '--card-radius', '--color-border-neutral-primary'],
    notes:
      'Always set showHeader and title. Use showBottomBar={false} when no footer. Never add padding directly to Card.',
  },
  DataTable: {
    export: 'DataTable',
    variants: ['default'],
    sizes: [],
    booleanProps: ['loading', 'selectable', 'stickyHeader'],
    tokens: ['--color-border-neutral-primary', '--color-background-interactive-secondary-hover'],
    notes: 'Never wrap in Card. Always full-width.',
  },
  Modal: {
    export: 'Modal',
    variants: ['default', 'wide'],
    sizes: [],
    booleanProps: ['open', 'loading'],
    tokens: ['--color-background-neutral-primary', '--color-shadow-default', '--z-index-modal'],
  },
  MediaViewer: {
    export: 'MediaViewer',
    variants: ['image', 'video', 'pdf', 'file'],
    sizes: [],
    booleanProps: ['open', 'showZoom', 'showCounter', 'showThumbnails', 'showMetadata', 'closeOnEscape'],
    tokens: [
      '--color-background-fixed-dark-primary',
      '--color-background-neutral-primary',
      '--color-background-fixed-light-primary',
      '--color-border-interactive-primary-selected',
      '--z-index-modal',
    ],
  },
  NotificationCenter: {
    export: 'NotificationCenter',
    variants: [],
    sizes: [],
    booleanProps: ['open', 'showFilter', 'loading'],
    tokens: [
      '--color-background-interactive-secondary-selected',
      '--color-background-interactive-secondary-hover',
      '--popover-width-lg',
      '--color-foreground-neutral-tertiary',
    ],
  },
  Drawer: {
    export: 'Drawer',
    variants: ['overlay', 'stacked'],
    sizes: [],
    booleanProps: ['open'],
    tokens: ['--color-background-neutral-primary', '--color-shadow-default', '--popover-width-lg'],
  },
  AlertDialog: {
    export: 'AlertDialog',
    variants: ['default', 'danger'],
    sizes: [],
    booleanProps: ['open'],
    tokens: ['--color-background-neutral-primary', '--color-shadow-default', '--z-index-modal'],
  },
  Charts: {
    export: 'Charts',
    variants: ['bar', 'line', 'area', 'pie', 'donut'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-dataviz-1', '--color-background-dataviz-2', '--color-background-dataviz-3'],
    notes: 'Always use --color-{background|border|foreground}-dataviz-* tokens. Never use semantic color tokens for dataviz.',
  },
  CalendarView: {
    export: 'CalendarView',
    variants: ['month', 'week', 'day', 'agenda'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-neutral-primary', '--color-border-neutral-primary', '--color-foreground-neutral-primary'],
  },
  VerticalButton: {
    export: 'VerticalButton',
    variants: ['primary', 'secondary', 'ghost', 'plain'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled', 'loading', 'selected'],
    tokens: ['--color-background-interactive-primary-default', '--color-foreground-inverse-primary'],
  },
  ToggleButton: {
    export: 'ToggleButton',
    variants: ['primary', 'secondary', 'ghost', 'plain'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled', 'loading', 'selected'],
    tokens: ['--color-background-interactive-primary-default', '--color-foreground-inverse-primary'],
  },
  SplitButton: {
    export: 'SplitButton',
    variants: ['primary', 'secondary'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled', 'loading'],
    tokens: ['--color-background-interactive-primary-default', '--button-shadow-group'],
  },
  ButtonGroupVertical: {
    export: 'ButtonGroupVertical',
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-border-neutral-primary'],
  },
  AvatarGroup: {
    export: 'AvatarGroup',
    variants: [],
    sizes: ['xxs', 'xs', 'sm', 'lg', 'xl', 'xxl'],
    booleanProps: [],
    tokens: ['--avatar-background'],
  },
  Command: {
    export: 'Command',
    variants: [],
    sizes: [],
    booleanProps: ['shouldFilter', 'loop'],
    tokens: ['--color-background-interactive-secondary-hover', '--color-border-neutral-primary', '--color-foreground-neutral-tertiary'],
    notes: 'Compose CommandInput → CommandList › CommandEmpty / CommandGroup › CommandItem / CommandSeparator. Runs actions; never holds a form value (use Combobox).',
  },
  CommandDialog: {
    export: 'CommandDialog',
    variants: [],
    sizes: [],
    booleanProps: ['open'],
    tokens: ['--popover-width-max'],
    notes: 'The ⌘K palette. App binds ⌘K / Ctrl K and closes it in CommandItem.onSelect.',
  },
  CarouselSlide: {
    export: 'CarouselSlide',
    variants: [],
    sizes: [],
    booleanProps: [],
    tokens: [],
  },
  ChipGroup: {
    export: 'ChipGroup',
    variants: [],
    sizes: [],
    booleanProps: [],
    tokens: ['--space-2xs'],
  },
  AttachmentChip: {
    export: 'AttachmentChip',
    variants: ['default'],
    sizes: ['sm', 'md'],
    booleanProps: ['disabled'],
    tokens: ['--color-border-neutral-primary', '--color-foreground-neutral-primary'],
  },
  AttachmentField: {
    export: 'AttachmentField',
    variants: ['default'],
    sizes: [],
    booleanProps: ['disabled', 'error'],
    tokens: ['--input-background-default', '--color-border-interactive-hover'],
  },
  AttachmentCard: {
    export: 'AttachmentCard',
    variants: ['default', 'compact'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-neutral-primary', '--color-border-neutral-primary'],
  },
  FileRow: {
    export: 'FileRow',
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-border-neutral-primary', '--color-foreground-neutral-primary'],
  },
  CustomViewTabs: {
    export: 'CustomViewTabs',
    variants: [],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-foreground-neutral-primary', '--color-border-interactive-primary-selected'],
  },
  TabNav: {
    export: 'TabNav',
    variants: [],
    sizes: [],
    booleanProps: ['current'],
    tokens: ['--color-foreground-interactive-primary-default', '--color-border-interactive-primary-selected'],
  },
};

// Chart exports share metadata; each is a separate public API entry.
const CHART_EXPORT_NAMES = [
  'LineChart',
  'BarChart',
  'DonutChart',
  'AreaChart',
  'HorizontalStackedBarChart',
  'StreamgraphChart',
  'BrushLineChart',
  'XYLineChart',
  'HeatmapChart',
  'ChartCard',
];

for (const chartName of CHART_EXPORT_NAMES) {
  COMPONENT_META[chartName] = {
    export: chartName,
    variants: ['default'],
    sizes: [],
    booleanProps: [],
    tokens: ['--color-background-dataviz-1', '--color-background-dataviz-2', '--color-background-dataviz-3'],
    notes: 'Always use --color-{background|border|foreground}-dataviz-* tokens. Never use semantic color tokens for dataviz.',
  };
}

// Re-exported from index.ts for composition but omitted from the agent component inventory.
const INTERNAL_SUB_COMPONENTS = new Set([
  'PageSelector',
  'PasswordRequirement',
  'SegmentControlSelector',
]);

// Public exports that share a source folder with another export.
// `parent` marks a sub-part of a compound component (documented on the parent's page).
const CO_LOCATED_EXPORTS = {
  AvatarGroup: { tier: 'atoms', dirName: 'Avatar', dirAbsSuffix: 'src/components/atoms/Avatar' },
  ChipGroup: { tier: 'atoms', dirName: 'Chip', dirAbsSuffix: 'src/components/atoms/Chip' },
  ToggleButton: { tier: 'atoms', dirName: 'Button', dirAbsSuffix: 'src/components/atoms/Button' },
  VerticalButton: { tier: 'atoms', dirName: 'Button', dirAbsSuffix: 'src/components/atoms/Button' },
  ButtonGroupVertical: { tier: 'atoms', dirName: 'ButtonGroup', dirAbsSuffix: 'src/components/atoms/ButtonGroup' },
  CustomViewTabs: { tier: 'atoms', dirName: 'CustomViewTab', dirAbsSuffix: 'src/components/atoms/CustomViewTab' },
  TabNav: { tier: 'atoms', dirName: 'Tab', dirAbsSuffix: 'src/components/atoms/Tab' },
  CarouselSlide: { tier: 'molecules', dirName: 'Carousel', dirAbsSuffix: 'src/components/molecules/Carousel', parent: 'Carousel' },
  CommandInput: { tier: 'organisms', dirName: 'Command', dirAbsSuffix: 'src/components/organisms/Command', parent: 'Command' },
  CommandList: { tier: 'organisms', dirName: 'Command', dirAbsSuffix: 'src/components/organisms/Command', parent: 'Command' },
  CommandEmpty: { tier: 'organisms', dirName: 'Command', dirAbsSuffix: 'src/components/organisms/Command', parent: 'Command' },
  CommandGroup: { tier: 'organisms', dirName: 'Command', dirAbsSuffix: 'src/components/organisms/Command', parent: 'Command' },
  CommandItem: { tier: 'organisms', dirName: 'Command', dirAbsSuffix: 'src/components/organisms/Command', parent: 'Command' },
  CommandSeparator: { tier: 'organisms', dirName: 'Command', dirAbsSuffix: 'src/components/organisms/Command', parent: 'Command' },
  CommandDialog: { tier: 'organisms', dirName: 'Command', dirAbsSuffix: 'src/components/organisms/Command', parent: 'Command' },
};

for (const chartName of CHART_EXPORT_NAMES) {
  CO_LOCATED_EXPORTS[chartName] = {
    tier: 'organisms',
    dirName: 'Charts',
    dirAbsSuffix: 'src/components/organisms/Charts',
    parent: 'Charts',
  };
}

// ─── Spec lookup helpers ──────────────────────────────────────────────────────

const SPEC_ALIASES = {
  SearchBar: 'specs/atoms/input-text-textarea-search.md',
  OTPInput: 'specs/atoms/otp-input.md',
  CommandInput: 'src/components/organisms/Command/Command.spec.md',
  CommandList: 'src/components/organisms/Command/Command.spec.md',
  CommandEmpty: 'src/components/organisms/Command/Command.spec.md',
  CommandGroup: 'src/components/organisms/Command/Command.spec.md',
  CommandItem: 'src/components/organisms/Command/Command.spec.md',
  CommandSeparator: 'src/components/organisms/Command/Command.spec.md',
  CommandDialog: 'src/components/organisms/Command/Command.spec.md',
};

function toKebabCase(exportName) {
  return exportName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

function resolveSpecPath(exportName, tier, dirAbs) {
  const colocated = join(dirAbs, `${exportName}.spec.md`);
  if (existsSync(colocated)) {
    return relative(ROOT, colocated);
  }
  const aliasSpecPath = SPEC_ALIASES[exportName];
  if (aliasSpecPath && existsSync(join(ROOT, aliasSpecPath))) {
    return aliasSpecPath;
  }
  const specTier = tier === 'atoms' ? 'atoms' : tier === 'molecules' ? 'molecules' : 'organisms';
  const kebabSpecPath = `specs/${specTier}/${toKebabCase(exportName)}.md`;
  const plainSpecPath = `specs/${specTier}/${exportName.toLowerCase()}.md`;
  if (existsSync(join(ROOT, kebabSpecPath))) return kebabSpecPath;
  if (existsSync(join(ROOT, plainSpecPath))) return plainSpecPath;
  return null;
}

// ─── Public API parsing (src/index.ts) ───────────────────────────────────────

function parsePublicComponentExports(indexSrc) {
  const exports = new Set();

  for (const match of indexSrc.matchAll(/^export\s+(?!type\b)\{([^}]+)\}\s+from/gm)) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (!name || !/^[A-Z]/.test(name)) continue;
      if (name.startsWith('use')) continue;
      if (INTERNAL_SUB_COMPONENTS.has(name)) continue;
      exports.add(name);
    }
  }

  return Array.from(exports).sort();
}

function findComponentPath(exportName) {
  const override = CO_LOCATED_EXPORTS[exportName];
  if (override) {
    const dirAbs = join(ROOT, override.dirAbsSuffix);
    return {
      tier: override.tier,
      dirName: override.dirName,
      dirAbs,
      path: override.dirAbsSuffix,
    };
  }

  const tiers = ['organisms', 'molecules', 'atoms'];
  const candidates = [];

  for (const tier of tiers) {
    const tierPath = join(ROOT, 'src/components', tier);
    for (const dirName of listDirs(tierPath)) {
      const dirAbs = join(tierPath, dirName);

      const nestedTsx = join(dirAbs, exportName, `${exportName}.tsx`);
      if (existsSync(nestedTsx)) {
        candidates.push({
          tier,
          dirName,
          dirAbs: join(dirAbs, exportName),
          path: `src/components/${tier}/${dirName}/${exportName}`,
          score: 3,
        });
        continue;
      }

      const flatTsx = join(dirAbs, `${exportName}.tsx`);
      if (existsSync(flatTsx)) {
        candidates.push({
          tier,
          dirName,
          dirAbs,
          path: `src/components/${tier}/${dirName}`,
          score: 2,
        });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}

// ─── Prop extraction (TypeScript compiler API) ───────────────────────────────
//
// Each public export's props come from its exported `<Name>Props` type, or —
// when there is none — from the first parameter of its call signature.
// `site/` runs this script from its own install, so typescript may live there.

function loadTypeScript() {
  for (const base of [ROOT, join(ROOT, 'site')]) {
    try {
      return createRequire(join(base, 'package.json'))('typescript');
    } catch {
      // try the next install
    }
  }
  return null;
}

function createPropsExtractor() {
  const ts = loadTypeScript();
  if (!ts) return null;

  const { config } = ts.readConfigFile(join(ROOT, 'tsconfig.json'), ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, ROOT);
  const indexPath = join(ROOT, 'src/index.ts');
  const program = ts.createProgram([indexPath], { ...options, noEmit: true });
  const checker = program.getTypeChecker();

  const resolve = sym => (sym && sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym);
  const moduleExports = sourceFile => {
    const moduleSym = sourceFile && checker.getSymbolAtLocation(sourceFile);
    return new Map((moduleSym ? checker.getExportsOfModule(moduleSym) : []).map(s => [s.name, s]));
  };
  const publicSymbols = moduleExports(program.getSourceFile(indexPath));
  const isExternal = decl => decl.getSourceFile().fileName.includes('/node_modules/');
  const oneLine = text =>
    text.replace(/\s+/g, ' ').replace(/;\s*}/g, ' }').replace(/\(\s+/g, '(').replace(/,?\s+\)/g, ')').trim();

  // String-literal union values in source order, following type aliases.
  function literalValuesFromNode(node, depth = 0) {
    if (!node || depth > 5) return null;
    if (ts.isParenthesizedTypeNode(node)) return literalValuesFromNode(node.type, depth + 1);
    if (ts.isUnionTypeNode(node)) {
      const parts = node.types.map(t => literalValuesFromNode(t, depth + 1));
      return parts.every(Boolean) ? parts.flat() : null;
    }
    if (node.kind === ts.SyntaxKind.UndefinedKeyword) return [];
    if (ts.isLiteralTypeNode(node)) {
      if (ts.isStringLiteral(node.literal)) return [node.literal.text];
      return node.literal.kind === ts.SyntaxKind.NullKeyword ? [] : null;
    }
    if (ts.isTypeReferenceNode(node) && !node.typeArguments) {
      const decl = resolve(checker.getSymbolAtLocation(node.typeName))?.declarations?.[0];
      return decl && ts.isTypeAliasDeclaration(decl) ? literalValuesFromNode(decl.type, depth + 1) : null;
    }
    return null;
  }

  function describeProp(prop) {
    const decl = prop.valueDeclaration ?? prop.declarations?.[0];
    const typeNode = decl && (ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl)) ? decl.type : undefined;
    const type = checker.getTypeOfSymbol(prop);
    const members = (type.isUnion() ? type.types : [type]).filter(
      t => !(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null))
    );

    const entry = {
      type: typeNode
        ? oneLine(typeNode.getText())
        : checker.typeToString(checker.getNonNullableType(type), undefined, ts.TypeFormatFlags.NoTruncation),
      required: !(prop.flags & ts.SymbolFlags.Optional),
    };
    if (members.length > 0 && members.every(t => t.flags & ts.TypeFlags.StringLiteral)) {
      const checkerValues = members.map(t => t.value);
      const sourceValues = literalValuesFromNode(typeNode);
      entry.values =
        sourceValues && sourceValues.length === checkerValues.length ? sourceValues : checkerValues;
    }
    if (members.length > 0 && members.every(t => t.flags & ts.TypeFlags.BooleanLiteral)) {
      entry.boolean = true; // stripped below — only used to derive booleanProps
    }
    return entry;
  }

  function findPropsType(exportName, componentSym) {
    const decl = componentSym.declarations?.[0];
    if (!decl) return null;

    const propsName = `${exportName}Props`;
    const propsSym = resolve(moduleExports(decl.getSourceFile()).get(propsName) ?? publicSymbols.get(propsName));
    if (propsSym && propsSym.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)) {
      return { name: propsName, type: checker.getDeclaredTypeOfSymbol(propsSym) };
    }

    const signature = checker.getTypeOfSymbolAtLocation(componentSym, decl).getCallSignatures()[0];
    const param = signature?.parameters[0];
    if (!signature) return null;
    return { name: null, type: param ? checker.getTypeOfSymbolAtLocation(param, decl) : null };
  }

  return exportName => {
    const componentSym = resolve(publicSymbols.get(exportName));
    const found = componentSym && findPropsType(exportName, componentSym);
    if (!found) return null;

    const props = {};
    let inheritsExternalProps = false;
    const all = found.type ? checker.getPropertiesOfType(found.type) : [];
    for (const prop of all) {
      const decls = prop.declarations ?? [];
      // DOM/React attribute bags would add hundreds of entries — flag them instead.
      if (decls.length > 0 && decls.every(isExternal)) {
        inheritsExternalProps = true;
        continue;
      }
      props[prop.name] = describeProp(prop);
    }
    return { propsType: found.name, props, inheritsExternalProps };
  };
}

// Used only when typescript is not installed: keep the committed prop data.
function readCommittedComponents() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'ds-index.json'), 'utf8')).components ?? {};
  } catch {
    return {};
  }
}

function propFields(exportName, meta, extractProps, committed) {
  const extracted = extractProps?.(exportName);
  if (!extracted) {
    const prior = committed[exportName];
    return {
      variants: prior?.variants ?? meta.variants ?? [],
      sizes: prior?.sizes ?? meta.sizes ?? [],
      booleanProps: prior?.booleanProps ?? meta.booleanProps ?? [],
      propsType: prior?.propsType ?? null,
      acceptsChildren: prior?.acceptsChildren ?? false,
      ...(prior?.inheritsExternalProps ? { inheritsExternalProps: true } : {}),
      props: prior?.props ?? {},
    };
  }

  const { propsType, props, inheritsExternalProps } = extracted;
  const booleanProps = Object.keys(props).filter(name => props[name].boolean);
  for (const entry of Object.values(props)) delete entry.boolean;

  return {
    // Derived from the `variant` / `size` prop types; never from Figma axis names.
    variants: props.variant?.values ?? [],
    sizes: props.size?.values ?? [],
    booleanProps,
    propsType,
    acceptsChildren: 'children' in props,
    ...(inheritsExternalProps ? { inheritsExternalProps: true } : {}),
    props,
  };
}

function buildComponentsFromPublicApi() {
  const indexSrc = readRequired('src/index.ts');
  const publicExports = parsePublicComponentExports(indexSrc);
  const extractProps = createPropsExtractor();
  const committed = extractProps ? {} : readCommittedComponents();
  if (!extractProps) {
    console.warn('WARN: typescript not installed — reusing prop data from the committed ds-index.json');
  }
  const result = {};
  const missing = [];

  for (const exportName of publicExports) {
    const location = findComponentPath(exportName);
    if (!location) {
      missing.push(exportName);
      continue;
    }

    const { tier, dirAbs, path } = location;
    const meta = COMPONENT_META[exportName] ?? {};
    const specPath = resolveSpecPath(exportName, tier, dirAbs);
    const { props, ...fields } = propFields(exportName, meta, extractProps, committed);

    result[exportName] = {
      tier: tier === 'atoms' ? 'atom' : tier === 'molecules' ? 'molecule' : 'organism',
      path,
      export: meta.export ?? exportName,
      ...fields,
      tokens: meta.tokens ?? [],
      spec: specPath,
      notes: meta.notes ?? '',
      ...(CO_LOCATED_EXPORTS[exportName]?.parent ? { parent: CO_LOCATED_EXPORTS[exportName].parent } : {}),
      props,
    };
  }

  if (missing.length > 0) {
    console.error('ERROR: Public export(s) in src/index.ts with no resolvable component path:');
    for (const name of missing) {
      console.error(`  - ${name}`);
    }
    process.exit(1);
  }

  return result;
}

/** Docs hub for the chart family — not a React export; story picker covers each primitive. */
function injectChartFamilyHub(components) {
  const meta = COMPONENT_META.Charts ?? {};
  components.Charts = {
    tier: 'organism',
    path: 'src/components/organisms/Charts',
    export: 'Charts',
    variants: meta.variants ?? [],
    sizes: meta.sizes ?? [],
    booleanProps: meta.booleanProps ?? [],
    propsType: null,
    acceptsChildren: false,
    tokens: meta.tokens ?? [],
    spec: 'specs/organisms/charts.md',
    notes:
      meta.notes ??
      'Chart primitives (LineChart, BarChart, AreaChart, …) and ChartCard. Import each export from ds-ngr; switch types in Storybook via the story selector.',
    props: {},
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function buildDsIndex() {
  const required = ['tokens.css', 'AI.md', 'AGENTS.md', 'specs/patterns/README.md', 'src/index.ts'];
  for (const f of required) {
    if (!existsSync(join(ROOT, f))) {
      console.error(`ERROR: Required file missing: ${f}`);
      process.exit(1);
    }
  }

  const tokensCss = readRequired('tokens.css');
  const patternsMd = readRequired('specs/patterns/README.md');

  const { primitives, semantics, component } = extractTokens(tokensCss);
  const rules = extractRules();
  const relationships = extractRelationships(patternsMd);
  const components = buildComponentsFromPublicApi();
  injectChartFamilyHub(components);

  return {
    meta: {
      version: '1.0.0',
      generated: new Date().toISOString(),
      gitCommit: getGitCommit(),
      componentsHash: getComponentsHash(),
      tokensHash: getTokensHash(tokensCss),
      stack: 'React + TypeScript + Vite + Styled Components v6',
      storybook: 'https://nagarro-dv.github.io/DSN/',
      figma: 'https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro',
      publicApiSource: 'src/index.ts',
      publicComponentCount: Object.keys(components).length,
    },
    rulesSource: 'AI.md — load this file for all rules and guidelines',
    rules,
    tokens: {
      source: 'tokens.css',
      layers: {
        primitives: '--primitive-<ramp>-<step> — tokens.css only, never in components or apps',
        semantics:
          '8 tiers: --color-{background|foreground|border|shadow}-*, --font-{family|size|weight|line-height|letter-spacing}-*, --space-*, --size-{control|container|border|breakpoint}-*, --shape-radius-*, --effect-{shadow|blur|border|opacity}-*, --motion-{duration|ease|transition}-*, --z-index-*',
        component: '--<component>-<property>-* (e.g. --button-background-primary-default, --popover-radius) — only that component may use it; apps never do',
      },
      grammar: 'Design Tokens/vocabulary.json — closed word lists. A word not on a list is a fabrication. Never write a token you have not seen in names below.',
      ladder: VOCAB.ladder.steps,
      absences: computeAbsences(semantics),
      families: extractTokenFamilies(tokensCss),
      counts: {
        primitives: primitives.length,
        semantics: semantics.length,
        component: component.length,
        total: primitives.length + semantics.length + component.length,
      },
      names: {
        primitives,
        semantics,
        component,
      },
    },
    components,
    patterns: {
      'data-page': {
        spec: 'specs/patterns/data-page.md',
        usedFor: 'Projects, Tasks, People — tabular record lists',
        assembly: ['AppShell', 'SectionHeader', 'Toolbar', 'DataTable', 'Pagination'],
        antiPatterns: [
          'Wrapping DataTable in Card',
          'Adding padding wrapper in main area',
        ],
      },
      'form-page': {
        spec: 'specs/patterns/form-page.md',
        usedFor: 'New record, edit record — full-page forms',
        assembly: ['AppShell', 'SectionHeader', 'Card', 'form inputs', 'Toolbar'],
        antiPatterns: [],
      },
      dashboard: {
        spec: 'specs/patterns/dashboard.md',
        usedFor: 'KPI stats and charts',
        assembly: ['AppShell', 'SectionHeader', 'Stat', 'Card', 'Charts'],
        antiPatterns: [],
      },
      'detail-drawer': {
        spec: 'specs/patterns/detail-drawer.md',
        usedFor: 'Row click → Drawer with DataListCell metadata',
        assembly: ['Drawer', 'DataListCell', 'Toolbar'],
        antiPatterns: [],
      },
    },
    // Runnable page templates (templates/*.jsx) — reference implementations of the patterns above.
    templates: Object.fromEntries(
      JSON.parse(readRequired('templates/index.json')).map(({ slug, ...t }) => [
        slug,
        { ...t, path: `templates/${slug}.jsx` },
      ]),
    ),
    relationships,
  };
}

function main() {
  const index = buildDsIndex();
  const outPath = join(ROOT, 'ds-index.json');
  writeFileSync(outPath, JSON.stringify(index, null, 2) + '\n');

  const componentEntries = Object.values(index.components);
  const totalComponents = componentEntries.length;
  const atomCount = componentEntries.filter(c => c.tier === 'atom').length;
  const moleculeCount = componentEntries.filter(c => c.tier === 'molecule').length;
  const organismCount = componentEntries.filter(c => c.tier === 'organism').length;
  const totalTokens =
    index.tokens.counts.primitives +
    index.tokens.counts.semantics +
    index.tokens.counts.component;

  console.log(`✓ ds-index.json generated`);
  console.log(`  Components: ${totalComponents} (${atomCount} atoms, ${moleculeCount} molecules, ${organismCount} organisms)`);
  console.log(`  Public API source: src/index.ts`);
  console.log(`  Tokens: ${totalTokens} (${index.tokens.counts.primitives} primitives, ${index.tokens.counts.semantics} semantics, ${index.tokens.counts.component} component)`);
  console.log(`  Timestamp: ${index.meta.generated}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
