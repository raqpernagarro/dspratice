'use client';

import { useMemo } from 'react';
import { Select } from 'ds-ngr';
import { ScaleStrip } from './ScaleStrip';
import {
  CUSTOM_BRAND_VALUE,
  accentScale,
  appliedBrandValue,
  brandChoices,
  choiceByValue,
  customChoiceLabel,
  type BrandChoice,
} from '@/lib/theme/brand-catalog';
import type { BrandSet } from '@/lib/theme/brands';
import { DEFAULT_SETTINGS, buildTheme, type ThemeSettings } from '@/lib/theme/theme';

type Props = {
  className?: string;
  brandSet: BrandSet;
  /** Site theme query ('' = Nagarro). Both pickers use this so they stay in sync. */
  appliedQuery: string;
  /** When the applied theme is custom, optional editor settings for the swatch. */
  previewSettings?: ThemeSettings;
  onPick: (choice: BrandChoice) => void;
};

export function BrandSelect({ className, brandSet, appliedQuery, previewSettings, onPick }: Props) {
  const choices = useMemo(() => brandChoices(brandSet), [brandSet]);
  const value = appliedBrandValue(brandSet, appliedQuery);
  const options = useMemo(() => {
    const base = choices.map((c) => ({
      value: c.value,
      label: c.label,
      description: c.description,
      icon: <ScaleStrip scale={accentScale(c.settings)} />,
    }));
    if (value === CUSTOM_BRAND_VALUE && previewSettings) {
      base.push({
        value: CUSTOM_BRAND_VALUE,
        label: customChoiceLabel(previewSettings),
        description: 'Custom settings',
        icon: <ScaleStrip scale={accentScale(previewSettings)} />,
      });
    }
    return base;
  }, [choices, value, previewSettings]);

  const selected = choiceByValue(choices, value);
  const leading = selected
    ? accentScale(selected.settings)
    : previewSettings
      ? accentScale(previewSettings)
      : accentScale(choices[0]?.settings ?? DEFAULT_SETTINGS);

  return (
    <Select
      className={className}
      aria-label="Brands"
      placeholder="Brand"
      icon
      leadingIcon={<ScaleStrip scale={leading} />}
      options={options}
      value={value === CUSTOM_BRAND_VALUE ? CUSTOM_BRAND_VALUE : value}
      onChange={(v) => {
        const choice = choiceByValue(choices, v);
        if (choice) onPick(choice);
      }}
    />
  );
}
