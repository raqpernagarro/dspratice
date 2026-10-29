import 'server-only';
import { z } from 'zod';
import {
  getComponent, getExclusionRules, getIndex, getLibraryVersion, getPropsSource, getRules, getStoriesFor, getUsageGuide,
  listComponentGroups, listComponents, listPatterns, readSpec, specLead, stripTitle, toSlug,
} from '@/lib/ds-knowledge';
import { compilePrototype, type KitRecord } from '@/lib/prototype';
import { renderRule } from '@/lib/rules/markdown';
import { RULE_CATEGORIES, type RuleCategory } from '@/lib/rules/types';
import {
  createKit, createPrototype, getKit, getPrototype, kitLinks, removeKitItem, saveKitComponent, saveKitOverride, saveKitPattern, saveKitRule, ServiceError, themeFor, updateKitTheme,
  updatePrototype,
} from '@/lib/prototype/service';
import { customizable, customizationForModel, proposeCustomization } from '@/lib/prototype/customize';
import { compileDraftOption, draftForModel, findSimilarComponents } from '@/lib/prototype/draft';
import { describeTheme, resolveTokens, type ResolvedTheme } from '@/lib/prototype/theme';
import { suggest } from '@/lib/prototype/validate';
import { JSX_SUBSET, KIT_GUIDE } from './guide';

/**
 * DS-Ngr tools, defined once. The MCP route registers them; the in-site chat
 * (Phase 3) will hand the same definitions to its model.
 */

export interface ToolContext {
  origin: string;
  /** Theme from the connection URL (or the kit's), used when a call names none. */
  theme: ResolvedTheme;
  kit: KitRecord | null;
  /** Edit token from the connection URL; required by kit-editing tools. */
  kitKey: string | null;
}

export interface ToolDef<S extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  input: S;
  readOnly: boolean;
  run: (args: z.objectOutputType<S, z.ZodTypeAny>, ctx: ToolContext) => Promise<unknown> | unknown;
  /** What the agent reads back, when the full result carries data meant for a UI. */
  forModel?: (output: never) => unknown;
}

const tool = <S extends z.ZodRawShape>(def: ToolDef<S>) => def as unknown as ToolDef;

const themeArgs = {
  theme: z.string().optional().describe('Override the connection theme: a configurator settings query (brand=…&font=…), a /brands share URL, or the "Edit:" URL from a theme.css.'),
  brand: z.string().optional().describe('Brand slug, when the theme is a multi-brand set.'),
};

const activeTheme = (args: { theme?: string; brand?: string }, ctx: ToolContext): ResolvedTheme =>
  args.theme !== undefined || args.brand !== undefined
    ? themeFor(args.theme ?? (ctx.theme.brandsParam ? `brands=${ctx.theme.brandsParam}` : ctx.theme.query), args.brand, null)
    : ctx.theme;

const kitSummary = (kit: KitRecord | null) =>
  kit && {
    id: kit.id,
    name: kit.name,
    components: kit.components.map((c) => ({ name: c.name, description: c.description, props: c.params })),
    patterns: kit.patterns.map((p) => ({ name: p.name, description: p.description })),
    customizes: Object.entries(kit.overrides ?? {}).map(([component, o]) => ({ component, note: o.note, defaults: o.defaults })),
    rules: (kit.rules ?? []).map((r) => ({ id: r.id, title: r.title, appliesTo: r.appliesTo })),
  };

/** The kit's rules in AI.md style, to follow alongside DS-Ngr's. */
const teamRules = (kit: KitRecord | null) =>
  kit?.rules?.length ? `## Team rules — ${kit.name}\n\nFollow these as strictly as DS-Ngr's own rules. Where they conflict, DS-Ngr wins unless the team rule says it overrides.\n\n${kit.rules.map((r) => renderRule(r)).join('\n')}` : null;

const requireKit = (ctx: ToolContext) => {
  if (!ctx.kit) throw new ServiceError(400, 'This connection has no team kit. Connect with ?kit=<id>&key=<editToken>, or call create_kit.');
  return ctx.kit;
};

export const TOOLS: ToolDef[] = [
  tool({
    name: 'get_design_context',
    title: 'Get design context',
    description: 'Start here. The active theme (brand, font, shape, density), DS-Ngr usage rules, all component names by group, page patterns, team kit components, and the JSX subset prototypes are written in.',
    input: { ...themeArgs },
    readOnly: true,
    run: (args, ctx) => ({
      library: { name: 'DS-Ngr', version: getLibraryVersion() },
      theme: describeTheme(activeTheme(args, ctx)),
      teamKit: kitSummary(ctx.kit) ?? null,
      components: listComponentGroups().map((g) => ({ group: g.group, names: g.items.map((c) => c.name) })),
      patterns: listPatterns().map((p) => ({ name: p.slug, usedFor: p.usedFor })),
      rules: getUsageGuide(),
      teamRules: teamRules(ctx.kit),
      exclusionRules: getExclusionRules(),
      jsxSubset: JSX_SUBSET,
    }),
  }),

  tool({
    name: 'list_components',
    title: 'List components',
    description: 'DS-Ngr components (and team kit components) with tier, group, variants, sizes and a one-line summary. Filter by text.',
    input: { query: z.string().optional().describe('Case-insensitive filter on name or summary.') },
    readOnly: true,
    run: ({ query }, ctx) => {
      const q = query?.toLowerCase();
      const groups = new Map(listComponentGroups().flatMap((g) => g.items.map((c) => [c.name, g.group] as const)));
      const ds = listComponents().map((c) => ({
        name: c.name, source: 'ds-ngr', tier: c.tier, group: groups.get(c.name), variants: c.variants, sizes: c.sizes,
        summary: specLead(readSpec(c.spec)).slice(0, 240), ...(c.parts.length && { parts: c.parts }),
      }));
      const kit = (ctx.kit?.components ?? []).map((c) => ({ name: c.name, source: 'team-kit', summary: c.description, props: c.params }));
      return [...kit, ...ds].filter((c) => !q || c.name.toLowerCase().includes(q) || c.summary?.toLowerCase().includes(q));
    },
  }),

  tool({
    name: 'get_component',
    title: 'Get component',
    description: 'Everything needed to use one component correctly: its TypeScript props, usage spec (when to use, anti-patterns), variants, sizes and docs links. Works for team kit components too.',
    input: { name: z.string().describe('Component name, e.g. "DataTable" or a team kit component.') },
    readOnly: true,
    run: ({ name }, ctx) => {
      const own = ctx.kit?.components.find((c) => c.name === name);
      if (own) return { name, source: 'team-kit', description: own.description, props: own.params, code: own.source, issues: own.issues };
      const entry = getComponent(toSlug(name)) ?? listComponents().find((c) => c.name.toLowerCase() === name.toLowerCase());
      const indexed = getIndex().components[name];
      if (!entry && !indexed) {
        const close = suggest(name, Object.keys(getIndex().components));
        throw new ServiceError(404, `No component named ${name}.${close ? ` Did you mean ${close}?` : ''} Call list_components to browse.`);
      }
      const c = entry ?? { ...indexed!, name, slug: toSlug(name), parts: [] };
      const spec = readSpec(c.spec);
      return {
        name: c.name,
        source: 'ds-ngr',
        tier: c.tier,
        import: `import { ${c.name} } from 'ds-ngr';`,
        props: getPropsSource(c, c.name) ?? 'Props declaration not found — check the spec and stories.',
        variants: c.variants,
        sizes: c.sizes,
        ...(c.parts.length && { parts: c.parts.map((p) => ({ name: p, props: getPropsSource(getIndex().components[p] ?? c, p) })) }),
        notes: c.notes || undefined,
        spec: spec ? stripTitle(spec) : null,
        docsUrl: `${ctx.origin}/components/${c.slug}`,
        stories: getStoriesFor(c.path, c.name).map((s) => s.name).slice(0, 20),
        customizable: customizable(c.name),
        ...(ctx.kit?.overrides?.[c.name] && { teamCustomization: { ...ctx.kit.overrides[c.name], appliedAutomatically: 'Defaults and tokens apply to every use in prototypes; write only props that differ.' } }),
      };
    },
  }),

  tool({
    name: 'list_patterns',
    title: 'List patterns',
    description: 'Page patterns (DS-Ngr and team kit): what each is for.',
    input: {},
    readOnly: true,
    run: (_args, ctx) => [
      ...(ctx.kit?.patterns ?? []).map((p) => ({ name: p.name, source: 'team-kit', usedFor: p.description })),
      ...listPatterns().map((p) => ({ name: p.slug, source: 'ds-ngr', usedFor: p.usedFor })),
    ],
  }),

  tool({
    name: 'get_pattern',
    title: 'Get pattern',
    description: 'One page pattern: assembly steps, anti-patterns and the full spec — or a team pattern with its example JSX.',
    input: { name: z.string() },
    readOnly: true,
    run: ({ name }, ctx) => {
      const own = ctx.kit?.patterns.find((p) => p.name === name);
      if (own) return { name, source: 'team-kit', description: own.description, example: own.source };
      const p = listPatterns().find((x) => x.slug === name || x.title.toLowerCase() === name.toLowerCase());
      if (!p) throw new ServiceError(404, `No pattern named ${name}.`);
      const spec = readSpec(p.spec);
      return { name: p.slug, usedFor: p.usedFor, assembly: p.assembly, antiPatterns: p.antiPatterns, spec: spec ? stripTitle(spec) : null };
    },
  }),

  tool({
    name: 'get_tokens',
    title: 'Get tokens',
    description: 'Design tokens with their resolved light/dark values in the active theme. Filter by name fragment (e.g. "space", "foreground", "radius"). Use the token names in code — values are for reasoning only.',
    input: { filter: z.string().optional().describe('Name fragment, e.g. "background-button" or "space".'), limit: z.number().int().min(1).max(500).optional(), ...themeArgs },
    readOnly: true,
    run: ({ filter, limit, ...t }, ctx) => {
      const tokens = resolveTokens(activeTheme(t, ctx), filter);
      return { theme: activeTheme(t, ctx).label, count: tokens.length, tokens: tokens.slice(0, limit ?? 150) };
    },
  }),

  tool({
    name: 'get_theme',
    title: 'Get theme',
    description: 'The active (or given) configurator theme: brand colour scales, font, shape, density, surface style, key colours per mode, contrast pairs below AA, and the brands in a multi-brand set.',
    input: { ...themeArgs },
    readOnly: true,
    run: (args, ctx) => describeTheme(activeTheme(args, ctx)),
  }),

  tool({
    name: 'validate_prototype',
    title: 'Validate prototype',
    description: 'Check JSX against DS-Ngr rules without saving. Returns errors, warnings and info with line numbers.',
    input: { source: z.string().describe('JSX source in the supported subset.') },
    readOnly: true,
    run: ({ source }, ctx) => {
      const r = compilePrototype(source, ctx.kit);
      return { renderable: r.ok, issues: r.issues };
    },
  }),

  tool({
    name: 'find_similar_components',
    title: 'Find similar components',
    description: 'Before drafting a new component: DS-Ngr and team kit components that may already cover the request, ranked, with a suggested verdict — use (one clearly fits), compose (build it from several), or new.',
    input: { description: z.string().describe('What the component is for, in the user\'s words.') },
    readOnly: true,
    run: ({ description }, ctx) => findSimilarComponents(description, ctx.kit),
  }),

  tool({
    name: 'propose_component_options',
    title: 'Propose component options',
    description: `Compile 2–3 candidate team kit components and render each in a few usage states, without saving. Returns issues per option and state; fix them and call again with all options. ${KIT_GUIDE}`,
    input: {
      options: z.array(z.object({
        name: z.string().describe('PascalCase, not a DS-Ngr or Lucide name.'),
        summary: z.string().describe('When to use it, one sentence.'),
        rationale: z.string().describe('The trade-off that sets this option apart, one sentence.'),
        source: z.string().describe('`export default function Name({ …props }) { return (…) }` in the JSX subset.'),
        states: z.array(z.object({
          label: z.string().describe('e.g. Default, Empty, Loading, Error, Long text, Disabled.'),
          usage: z.string().describe('JSX using the component, e.g. <OrderTimeline steps={[…]} />.'),
        })).min(1).max(8),
      })).min(1).max(3),
    },
    readOnly: true,
    run: ({ options }, ctx) => ({ options: options.map((o) => compileDraftOption(o, ctx.kit)) }),
    forModel: (output: { options: ReturnType<typeof compileDraftOption>[] }) => draftForModel(output.options),
  }),

  tool({
    name: 'propose_component_customization',
    title: 'Propose component customization',
    description: 'Draft 1–3 ways to customize one existing DS-Ngr component for this person or team, rendered before/after from the same samples, without saving. A customization is a layer, not a fork: it may point the component\'s own tokens (get_component → customizable.tokens) at other tokens — var(--…) only, never raw values — and set default props (customizable.props). Returns issues per option; fix them and call again with all options.',
    input: {
      component: z.string().describe('DS-Ngr component name, e.g. "Card".'),
      samples: z.array(z.object({
        label: z.string().describe('e.g. Default, With actions, Dense.'),
        usage: z.string().describe('JSX using the component directly, e.g. <Card title="Q3 revenue">…</Card>. Set only per-use props so defaults show.'),
      })).min(1).max(6),
      options: z.array(z.object({
        name: z.string().describe('Short name, e.g. "Softer", "Compact".'),
        summary: z.string().describe('What changes and why, one sentence.'),
        tokens: z.record(z.string(), z.string()).describe('Component token → var(--other-token).'),
        defaults: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).describe('Prop → default value.'),
      })).min(1).max(3),
    },
    readOnly: true,
    run: ({ component, samples, options }, ctx) => proposeCustomization(component, samples, options, ctx.kit),
    forModel: (output: ReturnType<typeof proposeCustomization>) => customizationForModel(output),
  }),

  tool({
    name: 'create_prototype',
    title: 'Create prototype',
    description: 'Render JSX on the DS-Ngr canvas in the active theme. Returns liveUrl (share it with the user), the editToken needed to update it, and any rule issues to fix.',
    input: { source: z.string(), title: z.string().describe('Short name, sentence case.'), ...themeArgs },
    readOnly: false,
    run: async ({ source, title, theme, brand }, ctx) => {
      const t = activeTheme({ theme, brand }, ctx);
      return createPrototype(
        { source, title, theme: t.brandsParam ? `brands=${t.brandsParam}` : t.query, brand: t.activeBrand, kitId: ctx.kit?.id },
        ctx.origin,
      );
    },
  }),

  tool({
    name: 'update_prototype',
    title: 'Update prototype',
    description: 'Replace a prototype\'s JSX (and optionally title or theme). An open liveUrl updates within seconds.',
    input: { id: z.string(), editToken: z.string(), source: z.string().optional(), title: z.string().optional(), ...themeArgs },
    readOnly: false,
    run: ({ id, editToken, source, title, theme, brand }, ctx) =>
      updatePrototype(id, editToken, { source, title, ...(theme !== undefined && { theme }), ...(brand !== undefined && { brand }) }, ctx.origin),
  }),

  tool({
    name: 'get_prototype',
    title: 'Get prototype',
    description: 'A saved prototype\'s JSX source, title, theme and current issues — to continue editing it. Private (password-protected) prototypes need their editToken.',
    input: { id: z.string(), editToken: z.string().optional() },
    readOnly: true,
    run: async ({ id, editToken }) => {
      const p = await getPrototype(id, editToken ?? null);
      return { id: p.id, title: p.title, version: p.version, theme: p.themeQuery || 'Nagarro', source: p.source, issues: p.issues };
    },
  }),

  tool({
    name: 'create_kit',
    title: 'Create team kit',
    description: 'Create a team kit that holds the team\'s theme plus their own components and patterns. Returns links: share mcpUrl with the team; keep mcpEditUrl private (it allows editing).',
    input: { name: z.string(), ...themeArgs },
    readOnly: false,
    run: ({ name, theme, brand }, ctx) => {
      const t = activeTheme({ theme, brand }, ctx);
      return createKit({ name, theme: t.brandsParam ? `brands=${t.brandsParam}` : t.query, brand: t.activeBrand }, ctx.origin);
    },
  }),

  tool({
    name: 'get_kit',
    title: 'Get team kit',
    description: 'The connected team kit: theme, components (with props and code) and patterns.',
    input: {},
    readOnly: true,
    run: async (_args, ctx) => {
      const kit = await getKit(requireKit(ctx).id);
      return {
        ...kitSummary(kit),
        theme: describeTheme(themeFor(null, null, kit)).name,
        components: kit.components.map((c) => ({ name: c.name, description: c.description, props: c.params, code: c.source })),
        links: kitLinks(ctx.origin, kit.id),
        canEdit: !!ctx.kitKey,
        authoring: KIT_GUIDE,
      };
    },
  }),

  tool({
    name: 'save_kit_component',
    title: 'Save kit component',
    description: `Add or replace a team kit component (needs the kit edit link). ${KIT_GUIDE}`,
    input: { name: z.string().optional().describe('Defaults to the function name.'), description: z.string().describe('When to use it, one or two sentences.'), source: z.string() },
    readOnly: false,
    run: (args, ctx) => saveKitComponent(requireKit(ctx).id, ctx.kitKey, { ...args }),
  }),

  tool({
    name: 'save_kit_override',
    title: 'Save component customization',
    description: 'Save this kit\'s layer on one DS-Ngr component: component tokens → var(--token), and default props (needs the kit edit link). Replaces any previous customization of that component.',
    input: {
      component: z.string(),
      tokens: z.record(z.string(), z.string()).optional(),
      defaults: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
      note: z.string().optional().describe('Why the team customizes it, one sentence.'),
    },
    readOnly: false,
    run: (args, ctx) => saveKitOverride(requireKit(ctx).id, ctx.kitKey, args),
  }),

  tool({
    name: 'save_kit_pattern',
    title: 'Save kit pattern',
    description: 'Add or replace a team page pattern: a description of when to use it plus an example screen in JSX (needs the kit edit link).',
    input: { name: z.string(), description: z.string(), source: z.string().describe('Example screen JSX.') },
    readOnly: false,
    run: (args, ctx) => saveKitPattern(requireKit(ctx).id, ctx.kitKey, args),
  }),

  tool({
    name: 'save_kit_rule',
    title: 'Save kit rule',
    description: 'Add a team usage rule (omit id) or replace one (pass its KIT-NN id), needs the kit edit link. Use when the team asks to "remember" a convention. Sentence-case title; dos and donts are one short imperative line each; examples are code, marked good or bad. Returns lint warnings and overlaps with DS-Ngr rules — read them.',
    input: {
      id: z.string().optional().describe('KIT-NN of a rule to replace.'),
      title: z.string(),
      category: z.enum(RULE_CATEGORIES.map((c) => c.id) as [RuleCategory, ...RuleCategory[]]),
      appliesTo: z.array(z.string()).optional().describe('DS-Ngr component names the rule is about.'),
      description: z.string().optional(),
      dos: z.array(z.string()).optional(),
      donts: z.array(z.string()).optional(),
      examples: z.array(z.object({ kind: z.enum(['good', 'bad']), code: z.string(), lang: z.string().optional(), label: z.string().optional() })).optional(),
    },
    readOnly: false,
    run: (args, ctx) => saveKitRule(requireKit(ctx).id, ctx.kitKey, { ...args, examples: args.examples?.map((e) => ({ ...e, lang: e.lang ?? 'tsx' })) }),
  }),

  tool({
    name: 'remove_kit_item',
    title: 'Remove kit item',
    description: 'Remove a team kit component, pattern, component customization (override — the component goes back to plain DS-Ngr) or rule (name = its KIT-NN id). Needs the kit edit link.',
    input: { kind: z.enum(['component', 'pattern', 'override', 'rule']), name: z.string() },
    readOnly: false,
    run: ({ kind, name }, ctx) => removeKitItem(requireKit(ctx).id, ctx.kitKey, kind, name),
  }),

  tool({
    name: 'set_kit_theme',
    title: 'Set kit theme',
    description: 'Change the team kit\'s theme (needs the kit edit link).',
    input: { theme: z.string(), brand: z.string().optional() },
    readOnly: false,
    run: ({ theme, brand }, ctx) => updateKitTheme(requireKit(ctx).id, ctx.kitKey, theme, brand),
  }),
];
