// Client-safe: no fs. Splits a token name into the facets the Tokens page filters on.

export interface TokenFacets {
  tier: string;
  aspect: string;
  role: string;
  prominence: string;
  state: string;
}

export const FACET_KEYS = ['tier', 'aspect', 'role', 'prominence', 'state'] as const;
export type FacetKey = (typeof FACET_KEYS)[number];

/** Empty facet value — the tier has no aspects, or the name carries no such segment. */
export const NONE = '';

// Aspects per tier, from AGENTS.md "Eight token tiers". Multi-word aspects first.
const ASPECTS: Record<string, string[]> = {
  color: ['background', 'foreground', 'border', 'shadow'],
  font: ['line-height', 'letter-spacing', 'family', 'size', 'weight'],
  size: ['border'],
  shape: ['radius'],
  effect: ['shadow', 'blur', 'border', 'opacity'],
  motion: ['duration', 'ease', 'transition'],
};
const TIERS = ['z-index', 'color', 'font', 'space', 'size', 'shape', 'effect', 'motion'];
const STATES = new Set(['default', 'hover', 'pressed', 'active', 'focus']);
const PROMINENCE = new Set(['soft', 'strong', 'subtle', 'primary', 'secondary', 'tertiary']);

/**
 * Best-effort parse — token names don't fix every position, so role / prominence /
 * state are read by vocabulary: `--color-background-interactive-primary-hover` →
 * color · background · interactive · primary · hover. Component tokens pass their
 * component as `prefix`, so `--section-header-…` reads as tier `section-header`.
 */
export const tokenFacets = (name: string, prefix?: string): TokenFacets => {
  let rest = name.replace(/^--/, '');
  const tier = prefix ?? TIERS.find((t) => rest === t || rest.startsWith(`${t}-`)) ?? rest.split('-')[0];
  rest = rest.slice(tier.length + 1);
  const aspect = (ASPECTS[tier] ?? []).find((a) => rest === a || rest.startsWith(`${a}-`)) ?? NONE;
  if (aspect) rest = rest.slice(aspect.length + 1);
  const segs = rest ? rest.split('-') : [];

  const state = segs.length > 1 && STATES.has(segs[segs.length - 1]) ? segs.pop()! : NONE;
  const prominence = segs.find((s) => PROMINENCE.has(s)) ?? NONE;
  const role = segs.find((s) => s !== prominence) ?? NONE;
  return { tier, aspect, role, prominence, state };
};
