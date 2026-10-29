import { describe, expect, it } from 'vitest';
import { listTemplates, readTemplate } from '@/lib/ds-knowledge';
import { compilePrototype } from '@/lib/prototype';

/**
 * Page templates are reference implementations — they must pass the same
 * checks the playground and MCP run on AI-written screens, with no errors or
 * warnings. Fails when a component, prop or token they rely on changes.
 */
describe.each(listTemplates().map((t) => [t.slug]))('template %s', (slug) => {
  it('compiles and passes every rule', () => {
    const source = readTemplate(slug);
    expect(source, `templates/${slug}.jsx is missing`).toBeTruthy();
    const { ok, issues } = compilePrototype(source!);
    expect(ok).toBe(true);
    expect(issues.filter((i) => i.severity !== 'info').map((i) => `${i.severity} L${i.line ?? '?'}: ${i.message}`)).toEqual([]);
  });
});
