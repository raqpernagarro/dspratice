import { describe, expect, it } from 'vitest';
import { listTemplates, readTemplate } from '@/lib/ds-knowledge';

/**
 * The workspace templates share one sample app, so their Sidebar must be the
 * same everywhere except for which item is selected. Templates can't import a
 * shared nav (the prototype compiler takes one self-contained file), so this
 * keeps the copies from drifting. AI chat has its own nav and is excluded.
 */
const sidebarOf = (source: string) => {
  const start = source.indexOf('<Sidebar');
  const end = source.indexOf('\n          />', start);
  if (start < 0 || end < 0) return null;
  return source
    .slice(start, end)
    .replace(/, selected: true/g, '')
    .replace(/ selected(?= \/>)/g, '');
};

const workspaceNavs = listTemplates()
  .map((t) => ({ slug: t.slug, nav: sidebarOf(readTemplate(t.slug) ?? '') }))
  .filter((t): t is { slug: string; nav: string } => !!t.nav && t.nav.includes("id: 'main'"));

describe('workspace template sidebar', () => {
  it('is used by the workspace templates', () => {
    expect(workspaceNavs.map((t) => t.slug).sort()).toEqual(
      ['dashboard', 'data-page', 'detail-drawer', 'form-page', 'kanban-board', 'settings'],
    );
  });

  it.each(workspaceNavs.map((t) => [t.slug, t.nav]))('%s matches dashboard apart from selection', (_slug, nav) => {
    expect(nav).toBe(workspaceNavs.find((t) => t.slug === 'dashboard')!.nav);
  });

  it.each(workspaceNavs.map((t) => [t.slug]))('%s selects exactly one item', (slug) => {
    const source = readTemplate(slug)!;
    const nav = source.slice(source.indexOf('<Sidebar'), source.indexOf('\n          />', source.indexOf('<Sidebar')));
    const count = (nav.match(/, selected: true/g) ?? []).length + (nav.match(/ selected(?= \/>)/g) ?? []).length;
    expect(count).toBe(1);
  });
});
