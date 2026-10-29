'use client';

import { useEffect, useState } from 'react';
import { BrandSelect } from './BrandSelect';
import { type BrandChoice } from '@/lib/theme/brand-catalog';
import { BRANDS_KEY, EMPTY_BRAND_SET, THEME_CHANGE_EVENT, readBrands, type BrandSet } from '@/lib/theme/brands';
import { SITE_THEME_KEY, readSiteTheme, toSiteTheme, writeSiteTheme } from '@/lib/theme/site-theme';
import { buildTheme } from '@/lib/theme/theme';

/** Switches the site theme between built-in brands and saved ones. Always visible. */
export function BrandPicker() {
  const [brandSet, setBrandSet] = useState<BrandSet>(EMPTY_BRAND_SET);
  const [appliedQuery, setAppliedQuery] = useState('');

  useEffect(() => {
    const read = () => {
      setBrandSet(readBrands());
      setAppliedQuery(readSiteTheme()?.query ?? '');
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === BRANDS_KEY || e.key === SITE_THEME_KEY) read();
    };
    read();
    window.addEventListener(THEME_CHANGE_EVENT, read);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, read);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const apply = (choice: BrandChoice) => {
    writeSiteTheme(toSiteTheme(buildTheme(choice.settings), choice.query));
    setAppliedQuery(choice.query);
  };

  return (
    <BrandSelect
      className="site-brand-picker"
      brandSet={brandSet}
      appliedQuery={appliedQuery}
      onPick={apply}
    />
  );
}
