import { describe, expect, it, vi } from 'vitest';

// Kits live in memory here so tests never touch site/.data.
const mem = new Map<string, { id: string }>();
vi.mock('@/lib/prototype/store', async (orig) => ({
  ...(await orig<typeof import('@/lib/prototype/store')>()),
  getKitStore: () => ({ get: async (id: string) => structuredClone(mem.get(id) ?? null), put: async (r: { id: string }) => void mem.set(r.id, structuredClone(r)) }),
}));

const { createKit, getKit, removeKitItem, saveKitRule, themeFor } = await import('@/lib/prototype/service');
const { TOOLS } = await import('@/lib/mcp/tools');

const newKit = async () => createKit({ name: 'Payments' }, 'http://localhost');

describe('kit rules', () => {
  it('adds, numbers, replaces and removes rules', async () => {
    const { id, editToken } = await newKit();
    const a = await saveKitRule(id, editToken, { title: 'Confirm destructive actions', category: 'components', appliesTo: ['Modal'], donts: ['Delete on one click'] });
    const b = await saveKitRule(id, editToken, { title: 'Amounts show the currency', category: 'content', description: 'Always €12.00, never 12.', donts: ['Bare numbers', ' Bare numbers ', ''] });
    expect(b.rule.donts).toEqual(['Bare numbers']);
    expect([a.rule.id, b.rule.id]).toEqual(['KIT-01', 'KIT-02']);

    await saveKitRule(id, editToken, { ...a.rule, title: 'Confirm every destructive action' });
    expect((await getKit(id)).rules?.map((r) => r.title)).toEqual(['Confirm every destructive action', 'Amounts show the currency']);

    await removeKitItem(id, editToken, 'rule', 'KIT-01');
    expect((await getKit(id)).rules?.map((r) => r.id)).toEqual(['KIT-02']);
  });

  it('needs the edit token', async () => {
    const { id } = await newKit();
    await expect(saveKitRule(id, 'nope', { title: 'X', category: 'other', description: 'y' })).rejects.toMatchObject({ status: 403 });
  });

  it('blocks errors and returns warnings and overlaps', async () => {
    const { id, editToken } = await newKit();
    await expect(saveKitRule(id, editToken, { title: 'Empty', category: 'other' })).rejects.toMatchObject({ status: 422 });
    await expect(saveKitRule(id, editToken, { title: 'Ghost', category: 'other', appliesTo: ['NotAComponent'], description: 'x' })).rejects.toMatchObject({ status: 422 });

    const { issues } = await saveKitRule(id, editToken, { title: 'Toasts Stack On Top', category: 'layout', appliesTo: ['Toast'], dos: ['Use var(--z-index-made-up)'] });
    expect(issues.some((i) => i.field === 'title' && i.severity === 'warning')).toBe(true);
    expect(issues.some((i) => i.message.includes('--z-index-made-up'))).toBe(true);
    expect(issues.some((i) => i.severity === 'info' && i.message.startsWith('LCB-12'))).toBe(true);
  });

  it('reaches agents through get_design_context', async () => {
    const { id, editToken } = await newKit();
    await saveKitRule(id, editToken, { title: 'Amounts show the currency', category: 'content', dos: ['Write €12.00'] });
    const kit = await getKit(id);
    const ctx = await TOOLS.find((t) => t.name === 'get_design_context')!.run({} as never, { kit, kitKey: null, origin: 'http://localhost', theme: themeFor(null, null, kit) } as never);
    const out = ctx as { teamRules: string; teamKit: { rules: { id: string }[] } };
    expect(out.teamRules).toContain('### KIT-01: Amounts show the currency');
    expect(out.teamRules).toContain('✅ Write €12.00');
    expect(out.teamKit.rules).toEqual([{ id: 'KIT-01', title: 'Amounts show the currency', appliesTo: [] }]);
  });
});
