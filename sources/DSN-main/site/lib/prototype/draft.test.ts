import { describe, expect, it } from 'vitest';
import { compileDraftOption, draftForModel, findSimilarComponents } from './draft';

const CLEAN = `export default function OrderStatus({ title, status }) {
  return (
    <Card title={title} showBottomBar={false}>
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <Tag label={status} variant="success" />
      </div>
    </Card>
  );
}`;

const states = [
  { label: 'Default', usage: '<OrderStatus title="Order 1042" status="Shipped" />' },
  { label: 'Long text', usage: '<OrderStatus title="A very long order title that should wrap onto a second line" status="Awaiting carrier pickup" />' },
];

describe('findSimilarComponents', () => {
  it('points a request for an existing component at it', () => {
    const r = findSimilarComponents('user avatar with initials');
    expect(r.candidates[0].name).toBe('Avatar');
    expect(r.verdict).toBe('use');
  });

  it('maps everyday words onto library names', () => {
    expect(findSimilarComponents('a dropdown to pick a country').candidates.map((c) => c.name)).toContain('Select');
  });

  it('does not let one word win through its synonyms', () => {
    expect(findSimilarComponents('order status timeline with dates').verdict).toBe('compose');
  });

  it('says new when nothing is close', () => {
    expect(findSimilarComponents('zzz qqq').verdict).toBe('new');
  });
});

describe('compileDraftOption', () => {
  it('renders every state of a clean option with no errors', () => {
    const o = compileDraftOption({ name: 'OrderStatus', summary: 's', rationale: 'r', source: CLEAN, states });
    expect(o.errors).toBe(0);
    expect(o.params).toEqual(['title', 'status']);
    expect(o.states.every((s) => s.rendered && s.issues.length === 0)).toBe(true);
    expect(o.sheet?.kit?.components.OrderStatus).toBeTruthy();
  });

  it('reports hardcoded colours', () => {
    const source = CLEAN.replace("gap: 'var(--space-sm)'", "gap: 'var(--space-sm)', color: '#ff0000'");
    const o = compileDraftOption({ name: 'OrderStatus', summary: 's', rationale: 'r', source, states });
    expect(o.issues.map((i) => i.rule)).toContain('hardcoded-color');
    expect(o.errors).toBeGreaterThan(0);
  });

  it('rejects names that clash with the library', () => {
    const o = compileDraftOption({ name: 'Card', summary: 's', rationale: 'r', source: CLEAN.replace('OrderStatus', 'Card'), states: [{ label: 'Default', usage: '<Card />' }] });
    expect(o.issues.some((i) => i.rule === 'component-name')).toBe(true);
  });

  it('gives the model issues, not render trees', () => {
    const o = compileDraftOption({ name: 'OrderStatus', summary: 's', rationale: 'r', source: CLEAN, states });
    const out = draftForModel([o]);
    expect(JSON.stringify(out)).not.toContain('"root"');
    expect(out.options[0].states).toHaveLength(2);
  });
});
