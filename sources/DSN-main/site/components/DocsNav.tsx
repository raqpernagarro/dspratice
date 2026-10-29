import Link from 'next/link';
import { SideNav } from './SideNav';
import { GUIDES, listPatterns } from '@/lib/ds-knowledge';

/**
 * Left menu for every page under the Docs tab — one list (Guides, then Patterns),
 * like ComponentNav, so it stays put and keeps its scroll position across pages.
 * `active` is 'overview' or `guides/<slug>` / `patterns/<slug>`.
 */
export function DocsNav({ active }: { active?: string }) {
  const sections = [
    { label: 'Guides', base: '/guides', items: GUIDES },
    { label: 'Patterns', base: '/patterns', items: listPatterns() },
  ];
  return (
    <SideNav label="Docs">
      <p className="side-nav-heading">Overview</p>
      <Link href="/docs" aria-current={active === 'overview' ? 'page' : undefined}>All docs</Link>
      {sections.map(({ label, base, items }) => (
        <div key={label}>
          <p className="side-nav-heading">{label}</p>
          {items.map((i) => (
            <Link key={i.slug} href={`${base}/${i.slug}`} aria-current={active === `${base.slice(1)}/${i.slug}` ? 'page' : undefined}>
              {i.title}
            </Link>
          ))}
        </div>
      ))}
    </SideNav>
  );
}
