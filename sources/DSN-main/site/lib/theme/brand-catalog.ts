import { DENSITIES, SHAPES } from './shape-density';
import { SURFACE_STYLES } from './styles';
import {
  FONTS,
  PRESETS,
  buildTheme,
  decodeSettings,
  encodeSettings,
  presetFor,
  previewScales,
  type ThemeSettings,
} from './theme';
import type { BrandSet } from './brands';

/** Select value when the applied theme matches no built-in or saved brand. */
export const CUSTOM_BRAND_VALUE = '__custom__';

export type BrandChoice = {
  value: string;
  label: string;
  description?: string;
  settings: ThemeSettings;
  query: string;
};

export function describeBrandSettings(settings: ThemeSettings): string {
  return [
    FONTS.find((f) => f.id === settings.font)?.label.replace(' (Nagarro)', ''),
    SURFACE_STYLES.find((x) => x.value === settings.style)?.label,
    SHAPES.find((x) => x.value === settings.shape)?.label,
    DENSITIES.find((x) => x.value === settings.density)?.label,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Built-in brands (Nagarro, Ocean, …) plus saved brands whose settings are not already a built-in. */
export function brandChoices(brandSet: BrandSet): BrandChoice[] {
  const builtInQueries = new Set(PRESETS.map((p) => encodeSettings(p.settings)));
  const builtIn: BrandChoice[] = PRESETS.map((p) => ({
    value: `preset:${p.label}`,
    label: p.label,
    description: describeBrandSettings(p.settings),
    settings: p.settings,
    query: encodeSettings(p.settings),
  }));
  const saved = brandSet.brands
    .filter((b) => !builtInQueries.has(encodeSettings(b.settings)))
    .map((b) => ({
      value: `saved:${b.slug}`,
      label: b.name,
      description: b.slug === brandSet.defaultSlug ? 'Default brand' : 'Saved brand',
      settings: b.settings,
      query: encodeSettings(b.settings),
    }));
  return [...builtIn, ...saved];
}

/** Which option is selected for the theme currently applied to the site. */
export function appliedBrandValue(brandSet: BrandSet, appliedQuery: string): string {
  if (!appliedQuery) return 'preset:Nagarro';
  const preset = PRESETS.find((p) => encodeSettings(p.settings) === appliedQuery);
  if (preset) return `preset:${preset.label}`;
  const saved = brandSet.brands.find((b) => encodeSettings(b.settings) === appliedQuery);
  if (saved) return `saved:${saved.slug}`;
  return CUSTOM_BRAND_VALUE;
}

/** Settings for an applied query string ('' = Nagarro). */
export function settingsForAppliedQuery(appliedQuery: string): ThemeSettings {
  if (!appliedQuery) return PRESETS[0].settings;
  const preset = PRESETS.find((p) => encodeSettings(p.settings) === appliedQuery);
  if (preset) return preset.settings;
  return decodeSettings(appliedQuery);
}

export function choiceByValue(choices: BrandChoice[], value: string): BrandChoice | undefined {
  return choices.find((c) => c.value === value);
}

export function accentScale(settings: ThemeSettings) {
  return previewScales(buildTheme(settings)).accent;
}

/** Label for a custom applied theme (sidebar preview differs from applied). */
export function customChoiceLabel(settings: ThemeSettings): string {
  const p = presetFor(settings);
  return p === 'custom' ? 'Custom' : p;
}
