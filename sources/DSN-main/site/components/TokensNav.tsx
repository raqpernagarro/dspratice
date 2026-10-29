'use client';

import { useEffect, useState } from 'react';
import { SideNav } from './SideNav';
import { LAYERS, useTokenFilters } from './TokenFilters';

// Tier names keep their hyphen (Z-index); component names read as words (Section header).
const label = (family: string) => {
  const name = family === 'z-index' ? family : family.replace(/^color-/, '').replace(/-/g, ' ');
  return name[0].toUpperCase() + name.slice(1);
};

/**
 * Left menu for the Tokens page — one anchor per token family (the h3 ids),
 * under its layer: the eight semantic tiers (colour nested by aspect), then the
 * component tokens. Scroll-spy marks the family in view; families the current
 * filters leave empty are dropped.
 */
export function TokensNav() {
  const { visibleFamilies: families, layerOf } = useTokenFilters();
  const [activeId, setActiveId] = useState(families[0]);

  useEffect(() => {
    const els = families.map((f) => document.getElementById(f)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -65% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [families]);

  const link = (f: string, nested = false) => (
    <a
      key={f}
      href={`#${f}`}
      className={nested ? 'side-nav-nested' : undefined}
      aria-current={f === activeId ? 'location' : undefined}
      onClick={() => setActiveId(f)}
    >
      {label(f)}
    </a>
  );

  return (
    <SideNav label="Tokens">
      {LAYERS.map(({ layer, title }) => {
        const items = families.filter((f) => layerOf(f) === layer);
        if (items.length === 0) return null;
        const colors = items.filter((f) => f.startsWith('color-'));
        return (
          <div key={layer}>
            <p className="side-nav-heading">{title.replace(' tokens', '')}</p>
            {colors.length > 0 && <p className="side-nav-subheading">Color</p>}
            {colors.map((f) => link(f, true))}
            {items.filter((f) => !f.startsWith('color-')).map((f) => link(f))}
          </div>
        );
      })}
    </SideNav>
  );
}
