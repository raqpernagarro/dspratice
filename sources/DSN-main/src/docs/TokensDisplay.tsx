import { useMemo, useState } from 'react';

// Design tokens page — one tab per tier, in tier order, then Layer 1 (primitive)
// and Layer 3 (component). Every JSON path is the CSS name:
// button.background.primary.default → --button-background-primary-default.

type TokenTree = Record<string, any>;

function getByPath(root: TokenTree, path: string[]): any {
  let node: any = root;
  for (const segment of path) {
    if (node == null) return undefined;
    node = node[segment];
  }
  return node;
}

function isLeaf(node: any): boolean {
  return node != null && typeof node === 'object' && '$value' in node;
}

function collectLeaves(root: TokenTree, path: string[] = []): { path: string[]; node: any }[] {
  const leaves: { path: string[]; node: any }[] = [];
  for (const key of Object.keys(root)) {
    if (key.startsWith('$')) continue;
    const node = root[key];
    if (node == null || typeof node !== 'object') continue;
    if (isLeaf(node)) leaves.push({ path: [...path, key], node });
    else leaves.push(...collectLeaves(node, [...path, key]));
  }
  return leaves;
}

// ── Tiers ─────────────────────────────────────────────────────────────────

type Tier = 'color' | 'font' | 'space' | 'size' | 'shape' | 'effect' | 'motion' | 'z-index' | 'primitive' | 'component';

const TIERS: { key: Tier; label: string; aspects?: string[]; blurb: string }[] = [
  { key: 'color', label: 'Color', aspects: ['background', 'foreground', 'border', 'shadow'], blurb: 'Every semantic color, including scrims (background/overlay-*) and raw shadow colors.' },
  { key: 'font', label: 'Font', aspects: ['family', 'size', 'weight', 'line-height', 'letter-spacing'], blurb: 'Typography.' },
  { key: 'space', label: 'Space', blurb: 'One scale for padding, margin, and gap.' },
  { key: 'size', label: 'Size', blurb: 'Control heights, border widths, container max-widths, breakpoints.' },
  { key: 'shape', label: 'Shape', aspects: ['radius'], blurb: 'Corner geometry.' },
  { key: 'effect', label: 'Effect', aspects: ['shadow', 'blur', 'border', 'opacity'], blurb: 'Composite and visual effects that aren\u2019t a plain color or dimension.' },
  { key: 'motion', label: 'Motion', aspects: ['duration', 'ease', 'transition'], blurb: 'Timing.' },
  { key: 'z-index', label: 'Z-index', blurb: 'Stacking order, named by role.' },
  { key: 'primitive', label: 'Primitive', blurb: 'Layer 1: raw values that semantic tokens point at. Never used in components or apps.' },
  { key: 'component', label: 'Component', blurb: 'Layer 3: library-internal tokens, consumed only by the component they are named after. Apps never use them.' },
];
const TIER_KEYS = new Set(TIERS.map(t => t.key as string));

interface Token {
  name: string;
  path: string[];
  group: string;
  type: string;
  description: string;
  chain: ChainStep[];
  darkChain: ChainStep[] | null;
  value: number | string | undefined;
}

interface ChainStep {
  label: string;
  hex?: string;
}

/** Follow `{a.b.c}` aliases through the merged tier tree to the raw value. */
function resolveChain(all: TokenTree, start: unknown): { chain: ChainStep[]; value: number | string | undefined } {
  const chain: ChainStep[] = [];
  const visited = new Set<string>();
  let val: any = start;
  for (let guard = 0; guard < 12; guard++) {
    if (typeof val === 'string' && /^\{.+\}$/.test(val)) {
      const alias = val.slice(1, -1);
      if (visited.has(alias)) break;
      visited.add(alias);
      chain.push({ label: `--${alias.replace(/\./g, '-')}` });
      val = getByPath(all, alias.split('.'))?.$value;
      continue;
    }
    if (val && typeof val === 'object' && val.hex) {
      const hex = val.alpha != null && val.alpha < 1 ? `${val.hex} · ${Math.round(val.alpha * 100)}%` : val.hex;
      chain.push({ label: hex, hex: val.hex });
      return { chain, value: val.hex };
    }
    return { chain, value: val };
  }
  return { chain, value: undefined };
}

function sizeGroup(rest: string): string {
  if (/^(\d+|full)$/.test(rest)) return 'scale';
  return rest.split('-')[0];
}

function buildTier(all: TokenTree, tier: (typeof TIERS)[number]): Token[] {
  // Component tokens have no shared root: every top-level key that isn't a tier is a component.
  const roots = tier.key === 'component'
    ? Object.keys(all).filter(k => !k.startsWith('$') && !TIER_KEYS.has(k))
    : [tier.key];
  const leaves = roots.flatMap(key => (all[key] ? collectLeaves(all[key], [key]) : []));
  return leaves.map(({ path, node }) => {
    const { chain, value } = resolveChain(all, node.$value);
    const darkAlias = node.$extensions?.modes?.dark;
    const group = tier.key === 'component' ? path[0]
      : tier.key === 'primitive' ? path[1]
      : tier.aspects ? path[1] : tier.key === 'size' ? sizeGroup(path[1]) : tier.key;
    return {
      name: `--${path.join('-')}`,
      path,
      group,
      type: node.$type ?? '',
      description: node.$description ?? '',
      chain,
      darkChain: darkAlias ? resolveChain(all, darkAlias).chain : null,
      value,
    };
  });
}

// ── Shared chrome ──────────────────────────────────────────────────────────

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        maxWidth: 480,
        padding: '8px 12px',
        fontSize: 14,
        borderRadius: 6,
        border: '1px solid var(--color-border-neutral-primary)',
        background: 'var(--color-background-neutral-primary)',
        color: 'var(--color-foreground-neutral-primary)',
        marginBottom: 24,
      }}
    />
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <section style={{ marginBottom: 24 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px 0',
          fontSize: 'var(--font-size-display-sm)',
          color: 'var(--color-foreground-neutral-primary)',
          fontWeight: 'var(--font-weight-semibold)' as any,
        }}
      >
        <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>›</span>
        {title}
        <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-foreground-neutral-tertiary)' }}>({count})</span>
      </button>
      {open && children}
    </section>
  );
}

function TableHead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr>
        {columns.map(h => (
          <th
            key={h}
            style={{
              textAlign: 'left',
              fontSize: 12,
              color: 'var(--color-foreground-neutral-tertiary)',
              fontWeight: 600,
              padding: '6px 12px',
              borderBottom: '1px solid var(--color-border-neutral-primary)',
            }}
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function rowBg(i: number): string {
  return i % 2 === 0 ? 'var(--color-background-neutral-primary)' : 'var(--color-background-neutral-secondary)';
}

function TokenNameCell({ name }: { name: string }) {
  return (
    <td style={{ padding: '10px 12px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
      <code
        style={{
          fontFamily: 'monospace',
          fontSize: 12,
          color: 'var(--color-foreground-neutral-secondary)',
          background: 'var(--color-background-neutral-tertiary)',
          borderRadius: 'var(--shape-radius-2xs)',
          padding: '2px var(--space-3xs)',
        }}
      >
        {name}
      </code>
    </td>
  );
}

function DescriptionCell({ text }: { text: string }) {
  return (
    <td style={{ padding: '10px 12px', verticalAlign: 'top', fontSize: 'var(--font-size-body-sm)', color: 'var(--color-foreground-neutral-tertiary)' }}>
      {text}
    </td>
  );
}

// ── Values ──────────────────────────────────────────────────────────────

function Swatch({ hex }: { hex: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        borderRadius: 'var(--shape-radius-full)',
        border: '1px solid var(--color-border-neutral-primary)',
        background: hex,
        verticalAlign: 'middle',
        marginRight: 6,
        flexShrink: 0,
      }}
      title={hex}
    />
  );
}

function ChainCell({ chain }: { chain: ChainStep[] }) {
  if (chain.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontFamily: 'monospace', fontSize: 12, color: 'var(--color-foreground-neutral-secondary)' }}>
      {chain.map((step, i) => (
        <div key={i}>
          {i > 0 && <div style={{ color: 'var(--color-foreground-neutral-tertiary)' }}>↓</div>}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {step.hex && <Swatch hex={step.hex} />}
            <span>{step.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Snap Figma float noise (e.g. -0.30000001192092896) to clean decimals. */
function formatTokenNumber(value: number | string | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return String(value ?? '');
  return String(Number(value.toFixed(4)));
}

const FONT_WEIGHT_MAP: Record<string, number> = { Regular: 400, Medium: 500, Semibold: 600 };
const UNITLESS = /^--(z-index-|font-weight-|effect-opacity-)/;

/** Motion durations are stored in seconds by Figma. */
const toMs = (v: number | string | undefined) => {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return n < 10 ? Math.round(n * 1000) : n;
};

function formatValue(token: Token): string {
  const { value, name } = token;
  if (/^--motion-(duration|transition)-/.test(name)) return `${toMs(value)}ms`;
  if (value && typeof value === 'object') return 'ease'; // Figma easing enum → CSS keyword in tokens.css
  if (typeof value === 'number') return UNITLESS.test(name) ? formatTokenNumber(value) : `${formatTokenNumber(value)}px`;
  return String(value ?? '');
}

function Visual({ token }: { token: Token }) {
  const { name, value } = token;
  const n = typeof value === 'number' ? value : Number(value);
  const bar = (w: number) => (
    <div style={{ height: 12, width: Math.min(Math.max(w, 0), 300), background: 'var(--color-background-accent-strong-default)', borderRadius: 'var(--shape-radius-2xs)' }} />
  );
  if (name.startsWith('--font-size-')) return <span style={{ fontSize: `${value}px`, lineHeight: 1 }}>Aa</span>;
  if (name.startsWith('--font-weight-')) return <span style={{ fontWeight: FONT_WEIGHT_MAP[String(value)] ?? 400 }}>Aa</span>;
  if (name.startsWith('--font-family-')) return <span style={{ fontFamily: String(value) }}>Aa Bb Cc</span>;
  if (/^--motion-(duration|transition)-/.test(name)) return <MotionPreview ms={toMs(value)} />;
  if (Number.isNaN(n)) return null;
  if (name.startsWith('--space-') || /^--primitive-size-(\d+)$/.test(name)) return bar(n);
  if (name.startsWith('--shape-radius-')) {
    return <div style={{ width: 32, height: 32, background: 'var(--color-background-accent-strong-default)', borderRadius: Math.min(n, 16) }} />;
  }
  if (name.startsWith('--size-border-')) return <div style={{ width: 48, borderTop: `${n}px solid var(--color-foreground-neutral-primary)` }} />;
  return null;
}

function MotionPreview({ ms }: { ms: number }) {
  const [shifted, setShifted] = useState(false);
  return (
    <div
      onClick={() => setShifted(s => !s)}
      onMouseEnter={() => setShifted(true)}
      onMouseLeave={() => setShifted(false)}
      style={{
        width: 220,
        height: 24,
        background: 'var(--color-background-neutral-tertiary)',
        borderRadius: 'var(--shape-radius-full)',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      title="Click or hover to preview"
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 'var(--shape-radius-full)',
          background: 'var(--color-background-accent-strong-default)',
          position: 'absolute',
          left: 0,
          transform: shifted ? 'translateX(196px)' : 'translateX(0px)',
          transitionProperty: 'transform',
          transitionDuration: `${ms}ms`,
          transitionTimingFunction: 'ease',
        }}
      />
    </div>
  );
}

// ── Tab ─────────────────────────────────────────────────────────────────

function TierTab({ all, tier }: { all: TokenTree; tier: (typeof TIERS)[number] }) {
  const [query, setQuery] = useState('');
  const allTokens = useMemo(() => buildTier(all, tier), [all, tier]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? allTokens.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) : allTokens;
    const map = new Map<string, Token[]>();
    for (const key of tier.aspects ?? []) map.set(key, []);
    for (const t of filtered) {
      if (!map.has(t.group)) map.set(t.group, []);
      map.get(t.group)!.push(t);
    }
    for (const [key, list] of map) if (list.length === 0) map.delete(key);
    return map;
  }, [allTokens, query, tier]);

  // Primitive and component tabs mix types, so pick the color layout per section.
  const isColorSection = (tokens: Token[]) => tier.key === 'color' || tokens.every(t => t.type === 'color');

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--color-foreground-neutral-secondary)', marginBottom: 16 }}>
        {allTokens.length} {tier.key} tokens. {tier.blurb}
      </p>
      <SearchInput value={query} onChange={setQuery} placeholder="Filter tokens by name or description…" />
      {groups.size === 0 && <p style={{ color: 'var(--color-foreground-neutral-tertiary)' }}>No tokens match "{query}".</p>}
      {Array.from(groups.entries()).map(([key, tokens]) => { const isColor = isColorSection(tokens); return (
        <Section key={key} title={key} count={tokens.length}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <TableHead columns={isColor ? ['Token name', 'Light', 'Dark', 'Description'] : ['Token name', 'Visual', 'Value', 'Description']} />
            <tbody>
              {tokens.map((token, i) => (
                <tr key={token.name} style={{ background: rowBg(i) }}>
                  <TokenNameCell name={token.name} />
                  {isColor ? (
                    <>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        <ChainCell chain={token.chain} />
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        <ChainCell chain={token.darkChain ?? token.chain} />
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        <Visual token={token} />
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', fontSize: 13, color: 'var(--color-foreground-neutral-primary)' }}>
                        {token.chain.length > 1 && (
                          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-foreground-neutral-tertiary)' }}>{token.chain[0].label}</div>
                        )}
                        {formatValue(token)}
                      </td>
                    </>
                  )}
                  <DescriptionCell text={token.description} />
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ); })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────

/** Pass every tier file's JSON; they are merged into one tree for alias resolution. */
export function TokensDisplay({ tiers }: { tiers: TokenTree[] }) {
  const all = useMemo(() => Object.assign({}, ...tiers) as TokenTree, [tiers]);
  const [active, setActive] = useState<Tier>('color');
  const tier = TIERS.find(t => t.key === active)!;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, borderBottom: '1px solid var(--color-border-neutral-primary)', marginBottom: 24 }}>
        {TIERS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px 4px',
              fontSize: 14,
              fontWeight: 600,
              color: active === t.key ? 'var(--color-foreground-accent-strong)' : 'var(--color-foreground-neutral-secondary)',
              borderBottom: active === t.key ? '2px solid var(--color-background-accent-strong-default)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <TierTab key={active} all={all} tier={tier} />
    </div>
  );
}
