import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import manifest from '../../templates/index.json';

/**
 * Every page template in templates/ must mount with the real components.
 * Rule checks (tokens, props, AI.md rules) live in site/lib/prototype/templates.test.ts.
 */
const modules = import.meta.glob<{ default: ComponentType }>('../../templates/*.jsx');
const slugs = Object.keys(modules).map((p) => p.replace(/^.*\/(.+)\.jsx$/, '$1'));

describe('page templates', () => {
  it('has a template for every manifest entry', () => {
    expect(manifest.map((t) => t.slug).sort()).toEqual([...slugs].sort());
  });

  it.each(slugs)('%s renders', async (slug: string) => {
    const { default: Template } = await modules[`../../templates/${slug}.jsx`]();
    render(<Template />);
    expect(screen.getAllByRole('main').length).toBeGreaterThan(0);
  }, 30_000); // the first template pays for importing the whole library
});
