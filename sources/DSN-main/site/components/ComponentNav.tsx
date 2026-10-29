import Link from 'next/link';
import { SideNav } from './SideNav';
import { listComponentGroups } from '@/lib/ds-knowledge';

/** Left docs menu, grouped like the Storybook sidebar. `active` is a slug, or 'overview'. */
export function ComponentNav({ active }: { active?: string }) {
  return (
    <SideNav label="Components">
      <p className="side-nav-heading">Overview</p>
      <Link href="/components" aria-current={active === 'overview' ? 'page' : undefined}>All components</Link>
      {listComponentGroups().map(({ group, items }) => (
        <div key={group}>
          <p className="side-nav-heading">{group}</p>
          {items.map((c) => (
            <Link key={c.slug} href={`/components/${c.slug}`} aria-current={c.slug === active ? 'page' : undefined}>
              {c.label}
            </Link>
          ))}
        </div>
      ))}
    </SideNav>
  );
}
