import Link from 'next/link';
import { GUIDES, getLibraryVersion, listComponentGroups, listPatterns } from '@/lib/ds-knowledge';
import { BrandPicker } from './BrandPicker';
import { NavTabs } from './NavTabs';
import { SiteSearch, type SearchItem } from './SiteSearch';
import { ThemeToggle } from './ThemeToggle';

const searchItems = (): SearchItem[] => [
  ...listComponentGroups().flatMap(({ group, items }) =>
    items.map((c) => ({ href: `/components/${c.slug}`, label: c.label, description: group, group: 'Components', keywords: [c.name] })),
  ),
  ...listPatterns().map((p) => ({
    href: `/patterns/${p.slug}`,
    label: p.slug.charAt(0).toUpperCase() + p.slug.slice(1).replace(/-/g, ' '),
    description: 'Page pattern',
    group: 'Patterns',
  })),
  ...GUIDES.map((g) => ({ href: `/guides/${g.slug}`, label: g.title, description: 'Guide', group: 'Guides' })),
  { href: '/foundations/tokens', label: 'Tokens', description: 'Colors, spacing, typography', group: 'Foundations', keywords: ['color', 'spacing', 'typography', 'css variables'] },
];

export function SiteHeader({ storybookUrl }: { storybookUrl: string }) {
  return (
    <header className="site-header">
      <div className="site-header-row">
        <Link href="/" className="site-brand">
          DS-Ngr <span className="site-version">v{getLibraryVersion()}</span>
        </Link>
        <SiteSearch items={searchItems()} />
        <div className="site-header-actions">
          <a className="site-header-link" href={`${storybookUrl}/index.html`} target="_blank" rel="noreferrer">Storybook ↗</a>
          <BrandPicker />
          <ThemeToggle />
        </div>
      </div>
      <NavTabs />
    </header>
  );
}
