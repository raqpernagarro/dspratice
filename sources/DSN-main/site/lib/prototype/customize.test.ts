import { describe, expect, it } from 'vitest';
import { componentTokens, customizable, customizationForModel, proposeCustomization, validateOverride } from './customize';
import { overrideCss } from './ir';
import { compilePrototype } from './index';
import type { KitRecord } from './store';

const rules = (r: ReturnType<typeof validateOverride>) => r.issues.map((i) => i.rule);

describe('componentTokens', () => {
  it('reads the component-tier tokens a component’s CSS uses', () => {
    expect(componentTokens().get('Card')).toContain('--card-radius');
    expect(componentTokens().get('Button')).toContain('--button-background-primary-default');
    expect(componentTokens().get('Card')!.some((t) => t.startsWith('--color-'))).toBe(false);
  });

  it('lists customizable props without per-use ones', () => {
    const props = customizable('Button').props.map((p) => p.name);
    expect(props).toEqual(expect.arrayContaining(['size', 'variant']));
    expect(props).not.toContain('onClick');
    expect(props).not.toContain('children');
  });
});

describe('validateOverride', () => {
  it('accepts a component token pointed at another token, and a valid default', () => {
    const r = validateOverride({ component: 'Card', tokens: { '--card-radius': 'var(--shape-radius-xl)' }, defaults: { headerSize: 'large' } });
    expect(r.issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(r.changes.map((c) => c.key)).toEqual(['--card-radius', 'headerSize']);
  });

  it('names the other components a shared token reaches', () => {
    expect(validateOverride({ component: 'Card', tokens: { '--card-radius': 'var(--shape-radius-xl)' }, defaults: {} }).affects).toContain('Callout');
  });

  it('rejects raw values, global tokens, other components’ tokens and unknown targets', () => {
    expect(rules(validateOverride({ component: 'Card', tokens: { '--card-radius': '24px' }, defaults: {} }))).toContain('raw-value');
    expect(rules(validateOverride({ component: 'Card', tokens: { '--color-background-neutral-primary': 'var(--color-background-neutral-secondary)' }, defaults: {} }))).toContain('foreign-token');
    expect(rules(validateOverride({ component: 'Card', tokens: { '--button-foreground-primary': 'var(--shape-radius-xl)' }, defaults: {} }))).toContain('foreign-token');
    expect(rules(validateOverride({ component: 'Card', tokens: { '--card-radius': 'var(--shape-radius-huge)' }, defaults: {} }))).toContain('unknown-token');
  });

  it('rejects unknown props, bad values and per-use props', () => {
    expect(rules(validateOverride({ component: 'Button', tokens: {}, defaults: { sise: 'md' } }))).toContain('unknown-prop');
    expect(rules(validateOverride({ component: 'Button', tokens: {}, defaults: { size: 'xl' } }))).toContain('bad-value');
    expect(rules(validateOverride({ component: 'Button', tokens: {}, defaults: { onClick: 'x' } }))).toContain('not-a-default');
    expect(rules(validateOverride({ component: 'Button', tokens: {}, defaults: {} }))).toContain('empty');
  });
});

describe('overrideCss', () => {
  it('writes token references and drops anything else', () => {
    const css = overrideCss({ Card: { tokens: { '--card-radius': 'var(--shape-radius-xl)', '--evil': 'red;}body{display:none' }, defaults: {} } });
    expect(css).toBe(':root:root:root:root{--card-radius:var(--shape-radius-xl)}');
  });
});

describe('kit snapshots', () => {
  it('carry the kit’s layers even when no kit component is used', () => {
    const kit = { id: 'k', name: 'K', themeQuery: '', components: [], patterns: [], version: 3, editKeyHash: '', createdAt: '', updatedAt: '',
      overrides: { Button: { tokens: {}, defaults: { size: 'sm' }, note: '' } } } as KitRecord;
    expect(compilePrototype('<Button>Go</Button>', kit).kit?.overrides?.Button.defaults).toEqual({ size: 'sm' });
  });
});

describe('proposeCustomization', () => {
  const samples = [{ label: 'Default', usage: '<Card title="Q3 revenue" showBottomBar={false} />' }];

  it('renders before without the layer and after with it', () => {
    const out = proposeCustomization('Card', samples, [{ name: 'Softer', summary: 's', tokens: { '--card-radius': 'var(--shape-radius-xl)' }, defaults: {} }]);
    expect(out.sampleIssues).toEqual([]);
    expect(out.before?.kit?.overrides?.Card).toBeUndefined();
    expect(out.options[0].after?.kit?.overrides?.Card.tokens).toEqual({ '--card-radius': 'var(--shape-radius-xl)' });
    expect(out.options[0].errors).toBe(0);
  });

  it('gives the model issues and changes, not render trees', () => {
    const out = proposeCustomization('Card', samples, [{ name: 'Raw', summary: 's', tokens: { '--card-radius': '20px' }, defaults: {} }]);
    const m = customizationForModel(out);
    expect(JSON.stringify(m)).not.toContain('"root"');
    expect(m.options[0].errors).toBe(1);
  });
});
