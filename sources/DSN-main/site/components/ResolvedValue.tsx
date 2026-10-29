'use client';

import { useEffect, useState } from 'react';

/**
 * Shows what a token resolves to right now (follows the theme toggle).
 * Spacing/radius tokens are var() chains, so the computed value is the useful one.
 */
export function ResolvedValue({
  token,
  prop = 'width',
}: {
  token: string;
  prop?: 'width' | 'border-radius' | 'color' | 'font-size';
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const read = () => {
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.setProperty(prop, `var(${token})`);
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      setValue(
        prop === 'border-radius'
          ? cs.borderTopLeftRadius
          : prop === 'color'
            ? cs.color
            : prop === 'font-size'
              ? cs.fontSize
              : cs.width,
      );
      probe.remove();
    };
    read();
    const observer = new MutationObserver(read);
    // Theme toggle flips data-theme; the theme configurator injects a <style> into <head>.
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [token, prop]);

  return <span className="sg-resolved">{value || '—'}</span>;
}
