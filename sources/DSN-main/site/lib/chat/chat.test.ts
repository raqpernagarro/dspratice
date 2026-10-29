import { afterEach, describe, expect, it, vi } from 'vitest';
import { TOOLS, type ToolContext } from '@/lib/mcp/tools';
import { ServiceError, themeFor } from '@/lib/prototype/service';
import type { KitRecord } from '@/lib/prototype';
import { isKeySource } from './models';
import { resolveModel } from './providers';
import { getOrgModel, orgConfigured } from './org';
import { toAiTools } from './tools';
import { POST } from '@/app/api/chat/route';

const ctx = (over: Partial<ToolContext> = {}): ToolContext => ({ origin: 'http://test', theme: themeFor('', null, null), kit: null, kitKey: null, ...over });
const KIT_ONLY = ['get_kit', 'save_kit_component', 'save_kit_override', 'save_kit_pattern', 'save_kit_rule', 'remove_kit_item', 'set_kit_theme'];
const COMPONENT_ONLY = ['propose_component_options', 'propose_component_customization'];

describe('toAiTools', () => {
  it('offers every MCP tool except kit tools when no kit is connected', () => {
    const names = Object.keys(toAiTools(ctx()));
    expect(names.sort()).toEqual(TOOLS.map((t) => t.name).filter((n) => !KIT_ONLY.includes(n) && !COMPONENT_ONLY.includes(n)).sort());
  });

  it('offers every MCP tool with an editable kit', () => {
    const kit = { id: 'aaaaaaaaaa', components: [], patterns: [] } as unknown as KitRecord;
    expect(Object.keys(toAiTools(ctx({ kit, kitKey: 'k' }))).sort()).toEqual(TOOLS.map((t) => t.name).filter((n) => !COMPONENT_ONLY.includes(n)).sort());
  });

  it('customize mode proposes layers but never writes', () => {
    const kit = { id: 'aaaaaaaaaa', components: [], patterns: [] } as unknown as KitRecord;
    const names = Object.keys(toAiTools(ctx({ kit, kitKey: 'k' }), 'customize'));
    expect(names).toEqual(expect.arrayContaining(['get_component', 'get_tokens', 'propose_component_customization']));
    expect(names).not.toContain('propose_component_options');
    expect(names.filter((n) => TOOLS.find((t) => t.name === n)?.readOnly === false)).toEqual([]);
  });

  it('component mode drafts options but never writes', () => {
    const kit = { id: 'aaaaaaaaaa', components: [], patterns: [] } as unknown as KitRecord;
    const names = Object.keys(toAiTools(ctx({ kit, kitKey: 'k' }), 'component'));
    expect(names).toEqual(expect.arrayContaining(['find_similar_components', 'propose_component_options', 'get_kit']));
    expect(names.filter((n) => TOOLS.find((t) => t.name === n)?.readOnly === false)).toEqual([]);
  });

  it('returns ServiceErrors as tool results so the model can recover', async () => {
    const out = await toAiTools(ctx()).get_component.execute!({ name: 'NoSuchWidget' }, { toolCallId: '1', messages: [] } as never);
    expect(out).toMatchObject({ error: expect.stringContaining('No component named NoSuchWidget') });
  });
});

describe('resolveModel', () => {
  it('rejects an unknown provider', () => {
    expect(() => resolveModel({ source: 'key', provider: 'acme' as never, apiKey: 'x' })).toThrow(/Unknown provider/);
  });

  it('needs a key for own-key and OpenRouter sources', () => {
    expect(() => resolveModel({ source: 'key', provider: 'anthropic', apiKey: null })).toThrow(ServiceError);
    expect(() => resolveModel({ source: 'openrouter', apiKey: '' })).toThrow(/API key/);
  });

  it('builds the demo model with no key', () => {
    expect(resolveModel({ source: 'demo', apiKey: null })).toMatchObject({ provider: 'ds-ngr-demo' });
    expect(isKeySource('demo')).toBe(true);
  });

  it('builds a model when a key is given', () => {
    expect(resolveModel({ source: 'key', provider: 'openai', apiKey: 'sk-test' })).toBeTruthy();
  });
});

describe('company key', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is off until configured', () => {
    vi.stubEnv('ORG_AI_PROVIDER', '');
    expect(orgConfigured()).toBe(false);
    expect(() => getOrgModel()).toThrow(/not configured/);
  });

  const chat = (source: string) =>
    POST(new Request('http://test/api/chat', { method: 'POST', body: JSON.stringify({ source, messages: [] }) }));

  it('answers 503 when unset and 401 for anonymous users once set', async () => {
    vi.stubEnv('ORG_AI_PROVIDER', '');
    expect((await chat('org')).status).toBe(503);
    vi.stubEnv('ORG_AI_PROVIDER', 'anthropic');
    vi.stubEnv('ORG_AI_KEY', 'k');
    vi.stubEnv('ORG_AI_MODEL', 'm');
    expect((await chat('org')).status).toBe(401);
  });

  it('answers 401 for own-key chat without a key header', async () => {
    expect((await chat('key')).status).toBe(401);
  });
});
