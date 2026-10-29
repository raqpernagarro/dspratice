import React, { useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComponentEntry {
  tier: string;
  path: string;
  export: string;
  variants: string[];
  sizes: string[];
  booleanProps: string[];
  tokens: string[];
  spec: string | null;
  notes: string;
}

interface DSIndex {
  meta: {
    version: string;
    generated: string;
    stack: string;
    storybook: string;
    figma: string;
  };
  rulesSource?: string;
  rules?: Record<string, string>;
  tokens: {
    source: string;
    layers: Record<string, string>;
    families?: string[] | Record<string, string>;
    counts: Record<string, number>;
    names?: {
      primitives: string[];
      semantics: string[];
      component: string[];
    };
  };
  components: Record<string, ComponentEntry>;
  patterns: Record<string, {
    spec: string;
    usedFor: string;
    assembly: string[];
    antiPatterns?: string[];
  }>;
  relationships: unknown;
}

// ─── Styles (all via CSS custom properties) ───────────────────────────────────

const styles = {
  root: {
    fontFamily: 'inherit',
    color: 'var(--color-foreground-neutral-primary)',
    maxWidth: '960px',
  } as React.CSSProperties,

  tabBar: {
    display: 'flex',
    gap: 'var(--space-lg, 24px)',
    borderBottom: '1px solid var(--color-border-neutral-primary)',
    marginBottom: 'var(--space-xl, 32px)',
  } as React.CSSProperties,

  tab: (active: boolean): React.CSSProperties => ({
    padding: 'var(--space-2xs, 4px) 0',
    paddingBottom: 'calc(var(--space-2xs, 4px) - 2px)',
    fontSize: 'var(--font-size-body-sm, 14px)',
    fontWeight: active ? 'var(--font-weight-medium, 500)' : 'var(--font-weight-regular, 400)',
    color: active ? 'var(--color-foreground-accent-strong)' : 'var(--color-foreground-neutral-secondary)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--color-background-accent-strong-default)' : '2px solid transparent',
    cursor: 'pointer',
    lineHeight: 'var(--font-line-height-body-sm, 1.5)',
    transition: 'color 0.15s',
  }),

  searchInput: {
    width: '100%',
    maxWidth: '320px',
    padding: 'var(--space-2xs, 4px) var(--space-xs, 8px)',
    fontSize: 'var(--font-size-body-sm, 14px)',
    lineHeight: 'var(--font-line-height-body-sm, 1.5)',
    color: 'var(--color-foreground-neutral-primary)',
    background: 'var(--color-background-neutral-secondary)',
    border: '1px solid var(--color-border-neutral-primary)',
    borderRadius: 'var(--shape-radius-2xs, 6px)',
    outline: 'none',
    marginBottom: 'var(--space-xl, 32px)',
    display: 'block',
  } as React.CSSProperties,

  sectionHeading: {
    fontSize: 'var(--font-size-display-sm, 18px)',
    fontWeight: 'var(--font-weight-semibold, 600)',
    color: 'var(--color-foreground-neutral-primary)',
    lineHeight: 'var(--font-line-height-display-sm, 1.3)',
    margin: '0 0 var(--space-lg, 24px) 0',
  } as React.CSSProperties,

  sectionBlock: {
    marginBottom: 'var(--space-2xl, 48px)',
  } as React.CSSProperties,

  collapseToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs, 8px)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    color: 'var(--color-foreground-neutral-primary)',
    fontSize: 'var(--font-size-display-sm, 18px)',
    fontWeight: 'var(--font-weight-semibold, 600)',
    lineHeight: 'var(--font-line-height-display-sm, 1.3)',
    marginBottom: 'var(--space-lg, 24px)',
  } as React.CSSProperties,

  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 'var(--space-lg, 24px)',
  } as React.CSSProperties,

  card: {
    background: 'var(--color-background-neutral-secondary)',
    borderRadius: 'var(--shape-radius-sm, 12px)',
    padding: 'var(--space-md, 16px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm, 12px)',
    minWidth: 0,
    overflow: 'hidden',
  } as React.CSSProperties,

  cardName: {
    fontSize: 'var(--font-size-body-md, 16px)',
    fontWeight: 'var(--font-weight-semibold, 600)',
    color: 'var(--color-foreground-neutral-primary)',
    margin: 0,
  } as React.CSSProperties,

  cardPath: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-size-body-sm, 12px)',
    color: 'var(--color-foreground-neutral-secondary)',
    background: 'var(--color-background-neutral-tertiary)',
    borderRadius: 'var(--shape-radius-2xs, 3px)',
    padding: 'var(--space-3xs, 2px) var(--space-2xs, 4px)',
    display: 'block',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,

  fieldLabel: {
    fontSize: 'var(--font-size-body-sm, 12px)',
    color: 'var(--color-foreground-neutral-tertiary)',
    fontWeight: 'var(--font-weight-medium, 500)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 'var(--space-2xs, 4px)',
  } as React.CSSProperties,

  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2xs, 4px)',
  } as React.CSSProperties,

  chip: {
    fontSize: 'var(--font-size-body-sm, 12px)',
    color: 'var(--color-foreground-neutral-secondary)',
    background: 'var(--color-background-neutral-secondary)',
    border: '1px solid var(--color-border-neutral-primary)',
    borderRadius: 'var(--shape-radius-full, 999px)',
    padding: '1px var(--space-2xs, 4px)',
    lineHeight: '1.5',
    display: 'inline-block',
  } as React.CSSProperties,

  specLink: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-size-body-sm, 12px)',
    color: 'var(--color-foreground-accent-strong)',
    textDecoration: 'none',
  } as React.CSSProperties,

  noteText: {
    fontSize: 'var(--font-size-body-sm, 12px)',
    color: 'var(--color-foreground-neutral-tertiary)',
    margin: 0,
    lineHeight: 'var(--font-line-height-body-sm, 1.5)',
  } as React.CSSProperties,

  mono: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-size-body-sm, 12px)',
    color: 'var(--color-foreground-neutral-secondary)',
    background: 'var(--color-background-neutral-tertiary)',
    borderRadius: 'var(--shape-radius-2xs, 3px)',
    padding: 'var(--space-3xs, 2px) var(--space-2xs, 4px)',
  } as React.CSSProperties,

  monoTruncated: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-size-body-sm, 12px)',
    color: 'var(--color-foreground-neutral-secondary)',
    background: 'var(--color-background-neutral-tertiary)',
    borderRadius: 'var(--shape-radius-2xs, 3px)',
    padding: 'var(--space-3xs, 2px) var(--space-2xs, 4px)',
    display: 'block',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,

  tokenRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--space-lg, 24px)',
    padding: 'var(--space-2xs, 4px) 0',
    borderBottom: '1px solid var(--color-border-neutral-primary)',
  } as React.CSSProperties,

  tokenName: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-size-body-sm, 12px)',
    color: 'var(--color-foreground-neutral-secondary)',
    flexShrink: 0,
    minWidth: '240px',
  } as React.CSSProperties,

  tokenDesc: {
    fontSize: 'var(--font-size-body-sm, 12px)',
    color: 'var(--color-foreground-neutral-tertiary)',
  } as React.CSSProperties,

  familyHeading: {
    fontSize: 'var(--font-size-body-md, 16px)',
    fontWeight: 'var(--font-weight-medium, 500)',
    color: 'var(--color-foreground-neutral-primary)',
    margin: 'var(--space-lg, 24px) 0 var(--space-2xs, 4px) 0',
  } as React.CSSProperties,

  infoNote: {
    fontSize: 'var(--font-size-body-sm, 14px)',
    color: 'var(--color-foreground-neutral-secondary)',
    background: 'var(--color-background-neutral-secondary)',
    borderRadius: 'var(--shape-radius-2xs, 6px)',
    padding: 'var(--space-xs, 8px) var(--space-md, 16px)',
    marginBottom: 'var(--space-xl, 32px)',
  } as React.CSSProperties,

  patternCard: {
    background: 'var(--color-background-neutral-secondary)',
    borderRadius: 'var(--shape-radius-sm, 12px)',
    padding: 'var(--space-md, 16px)',
    marginBottom: 'var(--space-lg, 24px)',
  } as React.CSSProperties,

  patternName: {
    fontSize: 'var(--font-size-body-md, 16px)',
    fontWeight: 'var(--font-weight-semibold, 600)',
    color: 'var(--color-foreground-neutral-primary)',
    margin: '0 0 var(--space-2xs, 4px) 0',
    textTransform: 'capitalize',
  } as React.CSSProperties,

  patternSubtitle: {
    fontSize: 'var(--font-size-body-sm, 14px)',
    color: 'var(--color-foreground-neutral-secondary)',
    margin: '0 0 var(--space-lg, 24px) 0',
  } as React.CSSProperties,

  assemblyList: {
    margin: '0',
    paddingLeft: 'var(--space-md, 16px)',
    fontSize: 'var(--font-size-body-sm, 14px)',
    color: 'var(--color-foreground-neutral-primary)',
    lineHeight: '1.7',
  } as React.CSSProperties,

  antiPatternItem: {
    color: 'var(--color-foreground-warning-strong)',
    fontSize: 'var(--font-size-body-sm, 14px)',
    lineHeight: '1.7',
  } as React.CSSProperties,

  dl: {
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    gap: 'var(--space-sm, 12px) var(--space-lg, 24px)',
    margin: 0,
  } as React.CSSProperties,

  dt: {
    fontSize: 'var(--font-size-body-sm, 14px)',
    fontWeight: 'var(--font-weight-medium, 500)',
    color: 'var(--color-foreground-neutral-primary)',
    margin: 0,
    paddingTop: 'var(--space-2xs, 4px)',
  } as React.CSSProperties,

  dd: {
    fontSize: 'var(--font-size-body-sm, 14px)',
    color: 'var(--color-foreground-neutral-secondary)',
    margin: 0,
    lineHeight: 'var(--font-line-height-body-sm, 1.5)',
  } as React.CSSProperties,

  emptyState: {
    padding: 'var(--space-md, 16px)',
    color: 'var(--color-foreground-neutral-tertiary)',
    fontSize: 'var(--font-size-body-sm, 14px)',
    background: 'var(--color-background-neutral-secondary)',
    borderRadius: 'var(--shape-radius-sm, 12px)',
  } as React.CSSProperties,

  countBadge: {
    fontSize: 'var(--font-size-body-sm, 12px)',
    color: 'var(--color-foreground-neutral-tertiary)',
    background: 'var(--color-background-neutral-tertiary)',
    borderRadius: 'var(--shape-radius-full, 999px)',
    padding: '1px 6px',
    marginLeft: 'var(--space-2xs, 4px)',
    fontWeight: 'var(--font-weight-regular, 400)',
  } as React.CSSProperties,
} as const;

// ─── Chip ────────────────────────────────────────────────────────────────────

function Chip({ label }: { label: string }) {
  return <span style={styles.chip}>{label}</span>;
}

function TruncatedMono({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <span style={{ ...styles.monoTruncated, ...style }} title={text}>
      {text}
    </span>
  );
}

// ─── Component card ──────────────────────────────────────────────────────────

function ComponentCard({ name, component }: { name: string; component: ComponentEntry }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardName}>{name}</p>
      <span style={styles.cardPath} title={component.path}>
        {component.path}
      </span>

      {component.variants.length > 0 && (
        <div>
          <div style={styles.fieldLabel}>Variants</div>
          <div style={styles.chipRow}>
            {component.variants.map(v => <Chip key={v} label={v} />)}
          </div>
        </div>
      )}

      {component.sizes.length > 0 && (
        <div>
          <div style={styles.fieldLabel}>Sizes</div>
          <div style={styles.chipRow}>
            {component.sizes.map(s => <Chip key={s} label={s} />)}
          </div>
        </div>
      )}

      {component.booleanProps.length > 0 && (
        <div>
          <div style={styles.fieldLabel}>Boolean props</div>
          <div style={styles.chipRow}>
            {component.booleanProps.map(p => <Chip key={p} label={p} />)}
          </div>
        </div>
      )}

      {component.tokens.length > 0 && (
        <div>
          <div style={styles.fieldLabel}>Key tokens</div>
          <div style={styles.chipRow}>
            {component.tokens.map(t => (
              <TruncatedMono
                key={t}
                text={t}
                style={{ display: 'inline-block', verticalAlign: 'top', maxWidth: '100%' }}
              />
            ))}
          </div>
        </div>
      )}

      {component.spec && (
        <div>
          <div style={styles.fieldLabel}>Spec</div>
          <TruncatedMono text={component.spec} />
        </div>
      )}

      {component.notes && (
        <p style={styles.noteText}>{component.notes}</p>
      )}
    </div>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={styles.sectionBlock}>
      <button style={styles.collapseToggle} onClick={() => setOpen(o => !o)}>
        <span>{open ? '▾' : '▸'}</span>
        <span>{title}</span>
        <span style={styles.countBadge}>{count}</span>
      </button>
      {open && children}
    </div>
  );
}

// ─── Components tab ───────────────────────────────────────────────────────────

function ComponentsTab({ components }: { components: DSIndex['components'] }) {
  const [query, setQuery] = useState('');
  const q = query.toLowerCase();

  const entries = Object.entries(components);
  const filterByTier = (tier: string) =>
    entries.filter(
      ([name, c]) => c.tier === tier && (!q || name.toLowerCase().includes(q))
    );

  const atoms = filterByTier('atom');
  const molecules = filterByTier('molecule');
  const organisms = filterByTier('organism');
  const totalVisible = atoms.length + molecules.length + organisms.length;

  return (
    <div>
      <input
        style={styles.searchInput}
        type="search"
        placeholder="Filter components…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label="Filter components"
      />

      {totalVisible === 0 && (
        <div style={styles.emptyState}>No components match "{query}".</div>
      )}

      {atoms.length > 0 && (
        <CollapsibleSection title="Atoms" count={atoms.length}>
          <div style={styles.cardGrid}>
            {atoms.map(([name, c]) => <ComponentCard key={name} name={name} component={c} />)}
          </div>
        </CollapsibleSection>
      )}

      {molecules.length > 0 && (
        <CollapsibleSection title="Molecules" count={molecules.length}>
          <div style={styles.cardGrid}>
            {molecules.map(([name, c]) => <ComponentCard key={name} name={name} component={c} />)}
          </div>
        </CollapsibleSection>
      )}

      {organisms.length > 0 && (
        <CollapsibleSection title="Organisms" count={organisms.length}>
          <div style={styles.cardGrid}>
            {organisms.map(([name, c]) => <ComponentCard key={name} name={name} component={c} />)}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ─── Tokens tab ───────────────────────────────────────────────────────────────

// Family prefix → description mapping (derived from ds-index families)
const FAMILY_PREFIXES: Array<{ prefix: string; label: string; desc: string }> = [
  { prefix: '--color-foreground-', label: 'Text colors', desc: 'CSS color property' },
  { prefix: '--color-background-', label: 'Backgrounds', desc: 'CSS background-color property' },
  { prefix: '--color-border-', label: 'Border', desc: 'CSS border-color, outline-color' },
  { prefix: '--color-background-dataviz-', label: 'Dataviz colors', desc: 'All chart and dataviz colors. Never use generic semantic tokens for dataviz.' },
  { prefix: '--font-size-', label: 'Font size', desc: 'Typography' },
  { prefix: '--font-weight-', label: 'Font weight', desc: 'Typography' },
  { prefix: '--font-line-height-', label: 'Line height', desc: 'Typography' },
  { prefix: '--color-shadow-elevation-', label: 'Elevation', desc: 'Box shadow' },
  { prefix: '--z-index-', label: 'Z-index', desc: 'Z-index stacking' },
  { prefix: '--space-md', label: 'Page margin', desc: 'Horizontal spacing for all containers' },
];

function groupSemanticsByFamily(semantics: string[]): Array<{
  label: string;
  desc: string;
  tokens: string[];
}> {
  const used = new Set<string>();
  const groups: Array<{ label: string; desc: string; tokens: string[] }> = [];

  for (const { prefix, label, desc } of FAMILY_PREFIXES) {
    const matches = semantics.filter(t => t.startsWith(prefix));
    if (matches.length > 0) {
      groups.push({ label, desc, tokens: matches });
      matches.forEach(t => used.add(t));
    }
  }

  // Remaining semantics that didn't match a known family
  const rest = semantics.filter(t => !used.has(t));
  if (rest.length > 0) {
    groups.push({ label: 'Scale and other', desc: 'Spacing scale, dimensions, and miscellaneous tokens', tokens: rest });
  }

  return groups;
}

function TokenRow({ name, desc }: { name: string; desc?: string }) {
  return (
    <div style={styles.tokenRow}>
      <code style={styles.tokenName}>{name}</code>
      {desc && <span style={styles.tokenDesc}>{desc}</span>}
    </div>
  );
}

function TokensTab({ tokens }: { tokens: DSIndex['tokens'] }) {
  const [query, setQuery] = useState('');
  const q = query.toLowerCase();

  const tokenNames = tokens.names ?? {
    primitives: [],
    semantics: [],
    component: [],
  };

  const filterTokens = (list: string[]) =>
    q ? list.filter(t => t.includes(q)) : list;

  const primitives = filterTokens(tokenNames.primitives);
  const semanticGroups = useMemo(
    () => groupSemanticsByFamily(tokenNames.semantics),
    [tokenNames.semantics]
  );
  const filteredGroups = semanticGroups.map(g => ({
    ...g,
    tokens: filterTokens(g.tokens),
  })).filter(g => g.tokens.length > 0);
  const componentTokens = filterTokens(tokenNames.component);

  return (
    <div>
      <div style={styles.infoNote}>
        For resolved values and visual swatches, see the Design tokens page.
      </div>

      <input
        style={styles.searchInput}
        type="search"
        placeholder="Filter tokens…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label="Filter tokens"
      />

      {/* Primitives */}
      <CollapsibleSection title="Primitives" count={primitives.length}>
        <p style={styles.noteText}>
          Raw values only. Never use primitives in components directly — always reference via semantic tokens.
        </p>
        <div style={{ marginTop: 'var(--space-sm, 12px)' }}>
          {primitives.map(t => <TokenRow key={t} name={t} />)}
        </div>
      </CollapsibleSection>

      {/* Semantics */}
      <CollapsibleSection title="Semantics" count={tokenNames.semantics.length}>
        <p style={styles.noteText}>
          Intent-named tokens. Always use these in components — never primitives or hardcoded values.
        </p>
        {filteredGroups.map(g => (
          <div key={g.label}>
            <h3 style={styles.familyHeading}>{g.label}</h3>
            {g.tokens.map(t => <TokenRow key={t} name={t} desc={g.desc} />)}
          </div>
        ))}
        {filteredGroups.length === 0 && query && (
          <div style={styles.emptyState}>No semantic tokens match "{query}".</div>
        )}
      </CollapsibleSection>

      {/* Component tokens */}
      <CollapsibleSection title="Component tokens" count={componentTokens.length}>
        <p style={styles.noteText}>
          Component-specific alias tokens. Reference semantics — no overrides ever needed.
        </p>
        <div style={{ marginTop: 'var(--space-sm, 12px)' }}>
          {componentTokens.map(t => <TokenRow key={t} name={t} desc="Component-specific background fill" />)}
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ─── Patterns tab ────────────────────────────────────────────────────────────

function PatternsTab({ patterns }: { patterns: DSIndex['patterns'] }) {
  return (
    <div>
      {Object.entries(patterns).map(([key, p]) => (
        <div key={key} style={styles.patternCard}>
          <h2 style={styles.patternName}>
            {key.replace(/-/g, ' ')}
          </h2>
          <p style={styles.patternSubtitle}>{p.usedFor}</p>

          <div style={styles.fieldLabel}>Assembly</div>
          <ol style={styles.assemblyList}>
            {p.assembly.map(c => <li key={c}>{c}</li>)}
          </ol>

          {p.antiPatterns && p.antiPatterns.length > 0 && (
            <div style={{ marginTop: 'var(--space-lg, 24px)' }}>
              <div style={styles.fieldLabel}>Anti-patterns</div>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-md, 16px)', listStyle: 'none' }}>
                {p.antiPatterns.map(a => (
                  <li key={a} style={styles.antiPatternItem}>
                    ⚠ {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: 'var(--space-lg, 24px)' }}>
            <div style={styles.fieldLabel}>Spec</div>
            <TruncatedMono text={p.spec} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Rules tab ───────────────────────────────────────────────────────────────

function toLabel(key: string): string {
  const s = key.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function RulesTab({ rules, rulesSource }: { rules?: DSIndex['rules']; rulesSource?: string }) {
  if (!rules || Object.keys(rules).length === 0) {
    return (
      <div style={styles.emptyState}>
        {rulesSource ?? 'Rules not available.'} Run{' '}
        <code style={styles.mono}>npm run index:generate</code> to rebuild the index.
      </div>
    );
  }

  return (
    <dl style={styles.dl}>
      {Object.entries(rules).map(([key, value]) => (
        <React.Fragment key={key}>
          <dt style={styles.dt}>{toLabel(key)}</dt>
          <dd style={styles.dd}>{value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

type Tab = 'components' | 'tokens' | 'patterns' | 'rules';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'components', label: 'Components' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'rules', label: 'Rules' },
];

interface Props {
  dsIndex: DSIndex | null;
}

export function DSIndexDisplay({ dsIndex }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('components');

  if (!dsIndex) {
    return (
      <div style={styles.emptyState}>
        <strong>ds-index.json not found.</strong> Run{' '}
        <code style={styles.mono}>npm run index:generate</code> to build the index.
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Meta bar */}
      <p style={{ ...styles.noteText, marginBottom: 'var(--space-lg, 24px)' }}>
        Generated {new Date(dsIndex.meta.generated).toLocaleString()} ·{' '}
        {Object.keys(dsIndex.components).length} components ·{' '}
        {dsIndex.tokens.counts.total} tokens · v{dsIndex.meta.version}
      </p>

      {/* Tab bar */}
      <div style={styles.tabBar} role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            style={styles.tab(activeTab === t.id)}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'components' && (
        <ComponentsTab components={dsIndex.components} />
      )}
      {activeTab === 'tokens' && (
        <TokensTab tokens={dsIndex.tokens} />
      )}
      {activeTab === 'patterns' && (
        <PatternsTab patterns={dsIndex.patterns} />
      )}
      {activeTab === 'rules' && (
        <RulesTab rules={dsIndex.rules} rulesSource={dsIndex.rulesSource} />
      )}
    </div>
  );
}
