/**
 * A component spec (`<Component>.spec.md`) as structured data, in the section
 * order the ds-component-doc skill and specs/_template/component.spec.md use.
 * markdown.ts turns it into the file and back.
 *
 * Sections the form knows get typed fields. Anything else — extra sections
 * like "Accessibility", or a known section whose content doesn't fit its
 * shape — is kept as `custom` markdown, so editing an existing spec never
 * drops what it said.
 */

export type TableRow = string[];

export type SpecSection = (
  | { kind: 'whatItIs'; text: string }
  | { kind: 'whenToUse'; lead: string; items: string[] }
  | { kind: 'whenNotToUse'; lead: string; items: string[] }
  | { kind: 'variants'; lead: string; tables: { heading: string; rows: TableRow[] }[] }
  | { kind: 'spatial'; lead: string; ownsPadding: string; ownsMargin: string; fillsContainer: string; notes: string }
  | { kind: 'composition'; lead: string; allowed: string[]; never: string[] }
  | { kind: 'props'; lead: string; rows: { prop: string; type: string; when: string }[] }
  | { kind: 'mistakes'; lead: string; items: { mistake: string; fix: string }[] }
  | { kind: 'examples'; lead: string; blocks: { lang: string; code: string }[] }
  | { kind: 'custom'; heading: string; body: string }
) & {
  /** The section ends with a `---` rule (older specs separate sections this way). */
  hr?: boolean;
};

export type SectionKind = SpecSection['kind'];
export type KnownKind = Exclude<SectionKind, 'custom'>;

export const SECTION_HEADINGS: Record<KnownKind, string> = {
  whatItIs: 'What it is',
  whenToUse: 'When to use',
  whenNotToUse: 'When NOT to use',
  variants: 'Variant selection',
  spatial: 'Spatial contract',
  composition: 'Composition rules',
  props: 'Props reference',
  mistakes: 'Common mistakes',
  examples: 'Examples',
};

/** What each section is for — shown as help text in the form and as comments in the template. */
export const SECTION_HELP: Record<KnownKind, string> = {
  whatItIs: 'One sentence: what it renders. Not when to use it.',
  whenToUse: 'Conditions an agent can check against its task. “Use when …”.',
  whenNotToUse: 'The most important section for agents. Each line names the alternative: “Do not use when … → use `X` instead”.',
  variants: 'For each prop with several meaningful values, when to choose each one.',
  spatial: 'How it handles its own space, so agents don’t double-pad or collide.',
  composition: 'What it can sit inside or combine with, and what it never should.',
  props: 'Only props that need guidance. Skip self-explanatory ones.',
  mistakes: 'Mistakes agents actually made. One line each, pointing to the rule.',
  examples: 'The most common usage, and one non-obvious case.',
};

export const KNOWN_ORDER = Object.keys(SECTION_HEADINGS) as KnownKind[];

export interface ComponentSpec {
  /** Lines before the `# Title` (e.g. a `{% raw %}` guard), kept verbatim. */
  preamble?: string;
  name: string;
  /** Empty = no such line (older specs have none). */
  tier: string;
  location: string;
  version: string;
  /** Other `**Key:** value` lines under the title, kept verbatim. */
  metaExtra: string[];
  /** Text between the meta lines and the first section. */
  intro: string;
  sections: SpecSection[];
}

export const emptySection = (kind: KnownKind): SpecSection => {
  switch (kind) {
    case 'whatItIs': return { kind, text: '' };
    case 'whenToUse':
    case 'whenNotToUse': return { kind, lead: '', items: [] };
    case 'variants': return { kind, lead: '', tables: [] };
    case 'spatial': return { kind, lead: '', ownsPadding: '', ownsMargin: '', fillsContainer: '', notes: '' };
    case 'composition': return { kind, lead: '', allowed: [], never: [] };
    case 'props': return { kind, lead: '', rows: [] };
    case 'mistakes': return { kind, lead: '', items: [] };
    case 'examples': return { kind, lead: '', blocks: [] };
  }
};

/** A blank spec with every required section, in template order. */
export const emptySpec = (name: string, tier: string, location: string): ComponentSpec => ({
  name,
  tier,
  location,
  version: '1.0.0',
  metaExtra: [],
  intro: '',
  sections: KNOWN_ORDER.map(emptySection),
});
