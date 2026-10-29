import { describe, expect, it } from 'vitest';
import { patchTokensCss } from './pull-request';

describe('patchTokensCss', () => {
  it('updates a component token line in tokens.css', () => {
    const src = '    --card-radius:            var(--shape-radius-lg);\n';
    const { next, changed } = patchTokensCss(src, { '--card-radius': 'var(--shape-radius-xl)' });
    expect(next).toContain('--card-radius:            var(--shape-radius-xl)');
    expect(changed).toEqual(['--card-radius']);
  });

  it('throws when the token is missing', () => {
    expect(() => patchTokensCss('--foo: 1;', { '--missing': 'var(--space-md)' })).toThrow(/not found/);
  });
});
