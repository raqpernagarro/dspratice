import { describe, expect, it } from 'vitest';
import { stepCountIs, streamText, type ModelMessage } from 'ai';
import type { ToolContext } from '@/lib/mcp/tools';
import { themeFor } from '@/lib/prototype/service';
import { getIndex } from '@/lib/ds-knowledge';
import { compileDraftOption } from '@/lib/prototype/draft';
import { proposeCustomization } from '@/lib/prototype/customize';
import { demoModel, pickTemplate } from './demo';
import { demoOptions, demoSamples } from './demo-customize';
import { DEMO_DRAFTS, pickDraft } from './demo-drafts';
import { freeToolModels } from './free-models';
import { toAiTools } from './tools';

const ctx: ToolContext = { origin: 'http://test', theme: themeFor('', null, null), kit: null, kitKey: null };

async function run(messages: ModelMessage[], mode: Parameters<typeof toAiTools>[1] = 'prototype', system?: string) {
  const result = streamText({ model: demoModel(), tools: toAiTools(ctx, mode), messages, system, stopWhen: stepCountIs(12) });
  await result.consumeStream();
  return { steps: await result.steps, text: await result.text, response: await result.response };
}

describe('pickTemplate', () => {
  it('matches requests to page templates', () => {
    expect(pickTemplate('Build a data page listing projects with status and owner')?.slug).toBe('data-page');
    expect(pickTemplate('A settings page with profile, notifications and security sections')?.slug).toBe('settings');
    expect(pickTemplate('A dashboard with four KPIs and a revenue chart')?.slug).toBe('dashboard');
    expect(pickTemplate('make it blue')).toBeNull();
  });
});

describe('demo model', () => {
  it('builds a prototype through the real tools', async () => {
    const { steps, text } = await run([{ role: 'user', content: 'Build a data page listing projects' }]);
    const calls = steps.flatMap((s) => s.toolCalls.map((c) => c.toolName));
    expect(calls).toEqual(['get_design_context', 'get_component', 'create_prototype']);
    const created = steps.flatMap((s) => s.toolResults).find((r) => r.toolName === 'create_prototype')?.output as { id?: string; issues?: { severity: string }[] };
    expect(created.id).toEqual(expect.any(String));
    expect(created.issues?.filter((i) => i.severity === 'error')).toEqual([]);
    expect(steps.at(-1)?.finishReason).toBe('stop');
    expect(text).toContain('Data page');
  });

  it('declines edits it cannot script', async () => {
    const first = await run([{ role: 'user', content: 'A KPI dashboard' }]);
    const { steps, text } = await run([
      { role: 'user', content: 'A KPI dashboard' },
      ...first.response.messages,
      { role: 'user', content: 'make it blue' },
    ]);
    expect(steps.flatMap((s) => s.toolCalls)).toEqual([]);
    expect(text).toMatch(/can’t follow edit requests/);
  });
});

describe('demo component drafts', () => {
  it('every scripted option compiles clean in every state', () => {
    for (const d of DEMO_DRAFTS) {
      for (const o of d.options) {
        const r = compileDraftOption(o);
        expect([o.name, r.errors, r.warnings]).toEqual([o.name, 0, 0]);
      }
    }
  });

  it('matches the page’s suggested prompts', () => {
    expect(pickDraft('A timeline showing the status history of an order')?.title).toBe('Order status timeline');
    expect(pickDraft('A row for a team member: avatar, name, role, and a status tag')?.title).toBe('Team member row');
    expect(pickDraft('A plan usage meter: label, used vs. limit')?.title).toBe('Usage meter');
    expect(pickDraft('a weather widget')).toBeNull();
  });

  it('checks what exists, then drafts options', async () => {
    const { steps } = await run([{ role: 'user', content: 'A plan usage meter with a warning when over 80%' }], 'component');
    expect(steps.flatMap((s) => s.toolCalls.map((c) => c.toolName))).toEqual(['find_similar_components', 'propose_component_options']);
    const out = steps.flatMap((s) => s.toolResults).find((r) => r.toolName === 'propose_component_options')?.output as { options: { errors: number }[] };
    expect(out.options.map((o) => o.errors)).toEqual([0, 0]);
  });

  it('only searches when the request is not one of its examples', async () => {
    const { steps } = await run([{ role: 'user', content: 'a weather widget' }], 'component');
    expect(steps.flatMap((s) => s.toolCalls.map((c) => c.toolName))).toEqual(['find_similar_components']);
  });
});

describe('demo customization', () => {
  it('gives clean options for every component it covers', () => {
    const covered = Object.keys(getIndex().components).filter((n) => demoOptions(n, '').length);
    expect(covered).toEqual(expect.arrayContaining(['Button', 'Card', 'Tag']));
    for (const name of covered) {
      const r = proposeCustomization(name, demoSamples(name), demoOptions(name, ''));
      expect([name, r.sampleIssues.length, r.options.reduce((n, o) => n + o.errors + o.warnings, 0), !!r.before]).toEqual([name, 0, 0, true]);
    }
  });

  it('puts the option the request asks for first', () => {
    expect(demoOptions('Button', 'make it more compact')[0].name).toBe('Compact');
    expect(demoOptions('Card', 'softer and rounder')[0].name).toBe('Rounder');
  });

  it('proposes a customization for the component in the system prompt', async () => {
    const { steps } = await run([{ role: 'user', content: 'Make it softer' }], 'customize', 'Customize mode.\n\nThe user is customizing Card.');
    const call = steps.flatMap((s) => s.toolCalls).find((c) => c.toolName === 'propose_component_customization');
    expect((call?.input as { component: string }).component).toBe('Card');
  });
});

describe('freeToolModels', () => {
  it('keeps only free models that can call tools', () => {
    const data = {
      data: [
        { id: 'paid/model', name: 'Paid', pricing: { prompt: '0.000003', completion: '0.000015' }, supported_parameters: ['tools'] },
        { id: 'free/no-tools:free', name: 'No tools (free)', pricing: { prompt: '0', completion: '0' }, supported_parameters: ['temperature'] },
        { id: 'free/tools:free', name: 'Tool model (free)', pricing: { prompt: '0', completion: '0' }, supported_parameters: ['tools', 'tool_choice'] },
      ],
    };
    expect(freeToolModels(data)).toEqual([{ value: 'free/tools:free', label: 'Tool model · free' }]);
    expect(freeToolModels(null)).toEqual([]);
  });
});
