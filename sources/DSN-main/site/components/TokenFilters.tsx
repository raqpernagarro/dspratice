'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Button, SearchBar, Select, Switcher } from 'ds-ngr';
import type { TokenGroup, TokenLayer } from '@/lib/ds-knowledge';
import { FACET_KEYS, tokenFacets, type FacetKey, type TokenFacets } from '@/lib/ds-knowledge/token-facets';
import { tokenPreview } from './tokenPreview';

// Select values for "no filter" and "token has no such segment".
const ANY = '*';
const NONE_OPT = '~';

type Filters = Partial<Record<FacetKey, string>> & { q: string };
type Row = { name: string; value: string; family: string; layer: TokenLayer; facets: TokenFacets };

export const LAYERS: { layer: TokenLayer; title: string; lead: string }[] = [
  {
    layer: 'semantic',
    title: 'Semantic tokens',
    lead: 'The eight tiers — color, font, space, size, shape, effect, motion and z-index. What components and apps consume.',
  },
  {
    layer: 'component',
    title: 'Component tokens',
    lead: 'Library-internal, prefixed by the component name. Only that component’s own styles consume them; apps never do.',
  },
];

const LABELS: Record<FacetKey, string> = {
  tier: 'Tier',
  aspect: 'Aspect',
  role: 'Role',
  prominence: 'Prominence',
  state: 'State',
};

const matches = (row: Row, f: Filters, skip?: FacetKey) =>
  FACET_KEYS.every((k) => k === skip || f[k] === undefined || row.facets[k] === f[k]) &&
  (!f.q || row.name.includes(f.q.trim().toLowerCase()));

interface Ctx {
  rows: Row[];
  visible: Row[];
  families: string[];
  visibleFamilies: string[];
  layerOf: (family: string) => TokenLayer;
  filters: Filters;
  /** Component-tier tokens are library-internal, so they stay out of the list until asked for. */
  includeComponents: boolean;
  setIncludeComponents: (on: boolean) => void;
  setFacet: (k: FacetKey, v: string | undefined) => void;
  setQuery: (q: string) => void;
  clear: () => void;
}

const TokenFilterContext = createContext<Ctx | null>(null);

export const useTokenFilters = () => {
  const ctx = useContext(TokenFilterContext);
  if (!ctx) throw new Error('useTokenFilters must be used inside TokenFilterProvider');
  return ctx;
};

/**
 * Holds the Tokens page filters and mirrors them to the query string, so a
 * filtered view can be shared as a link.
 */
export function TokenFilterProvider({ groups, children }: { groups: TokenGroup[]; children: React.ReactNode }) {
  const allRows = useMemo(
    () => groups.flatMap((g) =>
        g.tokens.map((t) => ({
          ...t,
          family: g.family,
          layer: g.layer,
          facets: tokenFacets(t.name, g.layer === 'component' ? g.family : undefined),
        })),
      ),
    [groups],
  );
  const [includeComponents, setIncludeComponents] = useState(false);
  const rows = useMemo(
    () => (includeComponents ? allRows : allRows.filter((r) => r.layer !== 'component')),
    [allRows, includeComponents],
  );
  const families = useMemo(() => groups.map((g) => g.family), [groups]);
  const layers = useMemo(() => new Map(groups.map((g) => [g.family, g.layer])), [groups]);
  const [filters, setFilters] = useState<Filters>({ q: '' });
  // Don't write the URL until it has been read, or the empty initial state wipes it.
  const [loaded, setLoaded] = useState(false);

  // Read the URL after mount so the server render (unfiltered) matches the first client render.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next: Filters = { q: params.get('q') ?? '' };
    for (const k of FACET_KEYS) if (params.has(k)) next[k] = params.get(k)!;
    setFilters(next);
    setIncludeComponents(params.get('components') === '1');
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (includeComponents) params.set('components', '1');
    for (const k of FACET_KEYS) if (filters[k] !== undefined) params.set(k, filters[k]!);
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  }, [filters, includeComponents, loaded]);

  const visible = useMemo(() => rows.filter((r) => matches(r, filters)), [rows, filters]);
  const visibleFamilies = useMemo(() => families.filter((f) => visible.some((r) => r.family === f)), [families, visible]);

  const ctx: Ctx = {
    rows,
    visible,
    families,
    visibleFamilies,
    layerOf: (family) => layers.get(family) ?? 'semantic',
    filters,
    includeComponents,
    setIncludeComponents: (on) => {
      setIncludeComponents(on);
      // Hiding component tokens drops any facet value only they carried.
      if (!on) {
        const pool = allRows.filter((r) => r.layer !== 'component');
        setFilters((f) => {
          const next = { ...f };
          for (const k of FACET_KEYS) {
            if (next[k] !== undefined && !pool.some((r) => matches(r, next))) next[k] = undefined;
          }
          return next;
        });
      }
    },
    setFacet: (k, v) =>
      setFilters((f) => {
        const next = { ...f, [k]: v };
        // A narrower facet that no longer matches anything under the new choice is dropped.
        for (const later of FACET_KEYS.slice(FACET_KEYS.indexOf(k) + 1)) {
          if (next[later] !== undefined && !rows.some((r) => matches(r, next))) next[later] = undefined;
        }
        return next;
      }),
    setQuery: (q) => setFilters((f) => ({ ...f, q })),
    clear: () => setFilters({ q: '' }),
  };

  return <TokenFilterContext.Provider value={ctx}>{children}</TokenFilterContext.Provider>;
}

/** Row of faceted Selects: each lists only values present among tokens matching the other filters. */
export function TokenFilterBar() {
  const { rows, visible, filters, includeComponents, setIncludeComponents, setFacet, setQuery, clear } = useTokenFilters();
  const active = !!filters.q || FACET_KEYS.some((k) => filters[k] !== undefined);

  return (
    <div className="token-filters-wrap">
      <div className="token-filters">
        <SearchBar
          className="token-filters-search"
          label="Search tokens"
          helperText=""
          optional
          placeholder="Search tokens, e.g. hover"
          value={filters.q}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
        />
        {FACET_KEYS.map((k) => {
          const counts = new Map<string, number>();
          for (const r of rows) if (matches(r, filters, k)) counts.set(r.facets[k], (counts.get(r.facets[k]) ?? 0) + 1);
          const values = [...counts.keys()].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)));
          const current = filters[k];
          return (
            <Select
              key={k}
              label={LABELS[k]}
              value={current === undefined ? ANY : current === '' ? NONE_OPT : current}
              options={[
                { value: ANY, label: 'All' },
                ...values.map((v) => ({ value: v || NONE_OPT, label: v || 'None', descriptionRight: String(counts.get(v)) })),
              ]}
              onChange={(v) => setFacet(k, v === ANY ? undefined : v === NONE_OPT ? '' : v)}
            />
          );
        })}
      </div>
      <div className="token-filters-meta" aria-live="polite">
        <span className="token-filters-toggle">
          <Switcher id="token-filters-components" size="sm" checked={includeComponents} onChange={setIncludeComponents} />
          <label htmlFor="token-filters-components">Include component tokens</label>
        </span>
        <span>{active ? `Showing ${visible.length} of ${rows.length} tokens` : `${rows.length} tokens`}</span>
        {active && <Button variant="ghost" size="sm" onClick={clear}>Clear filters</Button>}
      </div>
    </div>
  );
}

/** One table per family under its layer heading; empty families and layers hidden. */
export function TokenTables() {
  const { visible, visibleFamilies, layerOf } = useTokenFilters();
  if (visibleFamilies.length === 0) return <p className="muted">No tokens match these filters.</p>;

  return LAYERS.map(({ layer, title, lead }) => {
    const families = visibleFamilies.filter((f) => layerOf(f) === layer);
    if (families.length === 0) return null;
    return (
      <section key={layer} className="token-layer">
        <h2 id={`layer-${layer}`}>{title}</h2>
        <p className="muted">{lead}</p>
        {families.map((family) => {
          const tokens = visible.filter((r) => r.family === family);
          const previews = tokens.map((t) => tokenPreview(t.name));
          const hasPreview = previews.some(Boolean);
          return (
            <section key={family}>
              <h3 id={family}>{family}</h3>
              <table className="token-table">
                <thead><tr><th scope="col">Token</th><th scope="col">Light value</th>{hasPreview && <th scope="col">Preview</th>}</tr></thead>
                <tbody>
                  {tokens.map((t, i) => (
                    <tr key={t.name}>
                      <td><code>{t.name}</code></td>
                      <td className="muted"><code>{t.value}</code></td>
                      {hasPreview && <td className="tok-preview">{previews[i]}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </section>
    );
  });
}
