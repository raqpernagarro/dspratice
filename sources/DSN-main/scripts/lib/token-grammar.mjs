/**
 * DS-Ngr token grammar parser — checks a token name against Design Tokens/vocabulary.json.
 *
 *   primitive-<ramp>-<step>
 *   <component>-<property>-…                       (Layer 3, library-internal)
 *   <tier>-<aspect>-<role|step>[-<prominence>][-<state>]
 *
 * parseToken(name) → { layer, error } where error is null for a valid name.
 * Shadow aspects (color-shadow-*, effect-shadow-*) are only word-checked until
 * composite shadows land (handbook T11).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const VOCAB = JSON.parse(readFileSync(join(ROOT, 'Design Tokens', 'vocabulary.json'), 'utf8'));

const LADDER = new Set(VOCAB.ladder.steps);
const STATES = new Set(VOCAB.states.words);
const BANNED = VOCAB.banned.words;
const C = VOCAB.tiers.color;

/** Split `a-b-c` into words, keeping registered compounds (fixed-dark, line-height…) whole. */
const COMPOUNDS = ['line-height', 'letter-spacing', 'z-index', 'modal-backdrop', 'fixed-dark', 'fixed-light', 'section-header'];
// Ramp names are compounds only inside primitive-* (font-size is a tier+aspect elsewhere).
const PRIMITIVE_COMPOUNDS = ['alpha-dark', 'alpha-light', 'font-size'];
function words(name) {
  const compounds = name.startsWith('primitive-') ? [...COMPOUNDS, ...PRIMITIVE_COMPOUNDS] : COMPOUNDS;
  const out = [];
  const parts = name.split('-');
  for (let i = 0; i < parts.length; i++) {
    const pair = `${parts[i]}-${parts[i + 1]}`;
    if (compounds.includes(pair)) { out.push(pair); i++; } else out.push(parts[i]);
  }
  return out;
}

const fail = (layer, error) => ({ layer, error });
const ok = layer => ({ layer, error: null });

function checkColor(rest) {
  const [role, ...tail] = rest;
  if (!C.roles.includes(role)) return `unknown color role '${role}' (roles: ${C.roles.join(', ')})`;
  if (role === 'dataviz') return null;
  let t = tail;
  const mode = C.prominenceByRole[role];
  if (t.length && mode && C.prominence[mode].includes(t[0])) t = t.slice(1);
  else if (t.length && !STATES.has(t[0])) {
    const allowed = mode ? C.prominence[mode].join(', ') : 'none';
    return `'${t[0]}' is not a prominence for '${role}' (allowed: ${allowed}) or a state`;
  }
  if (t.length && STATES.has(t[0])) t = t.slice(1);
  if (t.length) return `unexpected '${t.join('-')}' after the state slot`;
  return null;
}

function checkLadder(rest, extra = []) {
  const w = rest.join('-');
  if (LADDER.has(w) || extra.includes(w)) return null;
  return `'${w}' is not a ladder step (${VOCAB.ladder.steps.join(' ')})${extra.length ? ` or ${extra.join(', ')}` : ''}`;
}

const TIER_RULES = {
  color: (aspect, rest) => (aspect === 'shadow' ? null : checkColor(rest)),
  font: (aspect, rest) => {
    const F = VOCAB.tiers.font;
    if (aspect === 'size' || aspect === 'line-height') {
      if (!F.roles.includes(rest[0])) return `unknown type role '${rest[0]}'`;
      return rest.length > 1 ? checkLadder(rest.slice(1)) : null;
    }
    if (aspect === 'letter-spacing' && rest.join('-') === 'display') return null;
    return [...F.roles, ...F.words].includes(rest.join('-')) ? null : `unknown ${aspect} word '${rest.join('-')}'`;
  },
  space: (_, rest) => checkLadder(rest),
  size: (aspect, rest) => {
    if (aspect === 'border') return checkLadder(rest, ['focus', 'icon']);
    if (aspect === 'container') return checkLadder(rest, ['height-min']);
    if (aspect === 'control') return rest[0] === 'height' ? checkLadder(rest.slice(1)) : `control size names its dimension: size-control-height-<step>`;
    return checkLadder(rest);
  },
  shape: (_, rest) => (rest[0] === 'control' ? checkLadder(rest.slice(1)) : checkLadder(rest)),
  effect: (aspect, rest) => (aspect === 'blur' ? checkLadder(rest) : null),
  // Durations are speeds, not sizes: motion-duration-fast, never motion-duration-sm.
  motion: (aspect, rest) => (aspect === 'ease' || (rest.length === 1 && VOCAB.tiers.motion.speeds.includes(rest[0]))
    ? null
    : `motion ${aspect} takes a speed (${VOCAB.tiers.motion.speeds.join(', ')}), got '${rest.join('-')}'`),
  'z-index': (_, rest) => (VOCAB.tiers['z-index'].roles.includes(rest.join('-')) ? null : `unknown z-index role '${rest.join('-')}'`),
};

export function parseToken(cssName) {
  const name = cssName.replace(/^--/, '');
  const w = words(name);
  for (const word of w) {
    if (BANNED[word]) return fail('?', `banned word '${word}' — use ${BANNED[word]}`);
  }
  if (w[0] === 'primitive') {
    return VOCAB.layers.primitive.ramps.includes(w[1]) ? ok('primitive') : fail('primitive', `unknown primitive ramp '${w[1]}'`);
  }
  if (VOCAB.layers.component.components.includes(w[0])) {
    return VOCAB.layers.component.properties.includes(w[1])
      ? ok('component')
      : fail('component', `unknown component property '${w[1]}' (properties: ${VOCAB.layers.component.properties.join(', ')})`);
  }
  const tier = VOCAB.tiers[w[0]];
  if (!tier) return fail('?', `'${w[0]}' is not a tier, 'primitive' or a component`);
  let rest = w.slice(1);
  let aspect = null;
  // A tier with its own ladder (size) also takes a bare step: size-md next to size-container-md.
  if (tier.aspects.length && tier.steps === 'ladder' && rest.length === 1 && LADDER.has(rest[0])) return ok('semantic');
  if (tier.aspects.length) {
    aspect = rest[0];
    if (!tier.aspects.includes(aspect)) return fail('semantic', `unknown ${w[0]} aspect '${aspect}' (aspects: ${tier.aspects.join(', ')})`);
    rest = rest.slice(1);
  }
  if (!rest.length) return fail('semantic', 'name stops after the aspect');
  const error = TIER_RULES[w[0]](aspect, rest);
  return error ? fail('semantic', error) : ok('semantic');
}

/**
 * Handbook T7: a family with hover or active states also has its -default.
 * (A lone disabled / focus / selected on a role doesn't imply a resting token.)
 */
export function missingDefaults(names) {
  const set = new Set(names.map(n => n.replace(/^--/, '')));
  const missing = [];
  for (const n of set) {
    const m = n.match(/^(.*)-(hover|active)$/);
    if (m && !set.has(`${m[1]}-default`) && !missing.includes(m[1])) missing.push(m[1]);
  }
  return missing;
}
