import 'server-only';
import type { LanguageModel } from 'ai';
import { getIndex, listTemplates, readTemplate, type TemplateEntry } from '@/lib/ds-knowledge';
import { demoOptions, demoSamples } from './demo-customize';
import { DEMO_DRAFTS, pickDraft } from './demo-drafts';

/**
 * Demo source: a scripted stand-in for a model, so the chat can be tried with
 * no key. It reads which page it is on from the tools it is offered:
 *   prototype  picks the page template closest to the message and replays a build:
 *              get_design_context → get_component → create_prototype → summary
 *   component  find_similar_components (real search, any request), then one of
 *              three scripted drafts (demo-drafts.ts) → propose_component_options
 *   customize  options generated from the component's own tokens and props
 *              (demo-customize.ts) → propose_component_customization
 */

// Provider-spec types, derived from `ai` so the site needs no direct @ai-sdk/provider dependency.
type LanguageModelV4 = Extract<LanguageModel, { specificationVersion: 'v4' }>;
type LanguageModelV4CallOptions = Parameters<LanguageModelV4['doStream']>[0];
type LanguageModelV4Prompt = LanguageModelV4CallOptions['prompt'];
type LanguageModelV4StreamPart = Awaited<ReturnType<LanguageModelV4['doStream']>>['stream'] extends ReadableStream<infer P> ? P : never;

const FALLBACK = 'dashboard';
/** Words too common across templates to say anything about which one is meant. */
const STOP = new Set(['page', 'with', 'and', 'the', 'for', 'build', 'make', 'create', 'show', 'screen', 'that', 'this', 'four', 'some']);
/** Layout chrome every template shares; the component worth looking up is the first one after these. */
const SHELL = new Set(['AppShell', 'Navbar', 'Sidebar', 'SidebarMenuSelector', 'Button', 'SectionHeader', 'Toolbar', 'SearchBar']);

const NO_EDITS =
  'Demo mode replays DS-Ngr page templates, so it can’t follow edit requests. Ask for another kind of page (dashboard, data page, settings, form, kanban, sign in), or use a free model to make real changes.';

const words = (s: string) => s.toLowerCase().match(/[a-z]+/g)?.filter((w) => w.length > 2 && !STOP.has(w)) ?? [];

/** The template whose slug, title, category and description share the most words with the request. */
export function pickTemplate(text: string): TemplateEntry | null {
  const asked = new Set(words(text));
  let best: TemplateEntry | null = null;
  let score = 0;
  for (const t of listTemplates()) {
    const known = new Set(words(`${t.slug.replace(/-/g, ' ')} ${t.title} ${t.category} ${t.description}`));
    // Title and slug words count double: "settings" should beat a description that mentions settings.
    const strong = new Set(words(`${t.slug.replace(/-/g, ' ')} ${t.title}`));
    let s = 0;
    for (const w of asked) if (known.has(w)) s += strong.has(w) ? 2 : 1;
    if (s > score) [best, score] = [t, s];
  }
  return best;
}

/** The component worth looking up: the first organism a template imports that isn't page chrome, else the first non-chrome one. */
function mainComponent(source: string): string {
  const names = source.match(/import\s*\{([^}]*)\}\s*from\s*['"]ds-ngr['"]/)?.[1].split(',').map((n) => n.trim()).filter((n) => n && !SHELL.has(n)) ?? [];
  const index = getIndex().components;
  return names.find((n) => index[n]?.tier === 'organism') ?? names[0] ?? 'Card';
}

const textOf = (m: LanguageModelV4Prompt[number]) =>
  m.role === 'user' ? m.content.map((p) => (p.type === 'text' ? p.text : '')).join(' ') : '';

interface Turn {
  mode: 'prototype' | 'component' | 'customize';
  /** The component being customized (customize mode), from the system prompt. */
  component: string | null;
  text: string;
  isFirst: boolean;
  /** Tool results so far in this turn, by tool name. */
  results: Map<string, unknown>;
}

function readTurn(prompt: LanguageModelV4Prompt, tools: string[]): Turn {
  let last = -1;
  prompt.forEach((m, i) => m.role === 'user' && (last = i));
  const results = new Map<string, unknown>();
  for (const m of prompt.slice(last + 1)) {
    if (m.role !== 'tool') continue;
    for (const p of m.content) if (p.type === 'tool-result') results.set(p.toolName, 'value' in p.output ? p.output.value : null);
  }
  const system = prompt.map((m) => (m.role === 'system' ? m.content : '')).join('\n');
  return {
    mode: tools.includes('propose_component_options') ? 'component' : tools.includes('propose_component_customization') ? 'customize' : 'prototype',
    component: system.match(/The user is customizing (\w+)\./)?.[1] ?? null,
    text: last >= 0 ? textOf(prompt[last]) : '',
    isFirst: prompt.filter((m) => m.role === 'user').length <= 1, results };
}

type Step = { say?: string; call?: { name: string; input: Record<string, unknown> } };

const EXAMPLES = DEMO_DRAFTS.map((d) => d.title.toLowerCase()).join(', ');

function componentStep(turn: Turn): Step {
  if (!turn.results.has('find_similar_components'))
    return {
      say: 'Demo mode: no AI is running. First I’ll check what DS-Ngr already has for this.',
      call: { name: 'find_similar_components', input: { description: turn.text } },
    };
  const draft = pickDraft(turn.text);
  if (!draft) {
    return {
      say: `The canvas shows the closest DS-Ngr components — that search is real. Demo mode can only draft options for its three examples (${EXAMPLES}). Pick one of those, or chat with a key to draft anything.`,
    };
  }
  if (!turn.results.has('propose_component_options')) return { call: { name: 'propose_component_options', input: { options: draft.options } } };
  const lines = draft.options.map((o, i) => `- **Option ${String.fromCharCode(65 + i)} — ${o.name}:** ${o.rationale}`).join('\n');
  return { say: `Here are two scripted options for a ${draft.title.toLowerCase()}:\n\n${lines}\n\nCompare them on the canvas, choose one and add it to a kit. Demo mode can’t revise them — chat with a key for that.` };
}

function customizeStep(turn: Turn): Step {
  const component = turn.component;
  const options = component ? demoOptions(component, turn.text) : [];
  if (!component || !options.length) {
    return { say: `Demo mode has no scripted customization for ${component ?? 'this component'}: it only knows corner radius, size, variant and a few on/off defaults. Try Button, Card or Tag, or chat with a key.` };
  }
  if (!turn.results.has('propose_component_customization'))
    return {
      say: `Demo mode: no AI is running. I’ll draft ${options.length} scripted way${options.length > 1 ? 's' : ''} to customize ${component}, using only its own tokens and default props.`,
      call: { name: 'propose_component_customization', input: { component, samples: demoSamples(component), options } },
    };
  const lines = options.map((o) => `- **${o.name}:** ${o.summary}`).join('\n');
  return { say: `Each option is shown next to today’s ${component}:\n\n${lines}\n\nChoose one and add it to a kit to try it in prototypes. Demo mode can’t revise them — chat with a key for that.` };
}

function nextStep(turn: Turn): Step {
  if (turn.mode === 'component') return componentStep(turn);
  if (turn.mode === 'customize') return customizeStep(turn);
  const template = pickTemplate(turn.text) ?? (turn.isFirst ? listTemplates().find((t) => t.slug === FALLBACK) ?? null : null);
  const source = template && readTemplate(template.slug);
  if (!template || !source) return { say: NO_EDITS };

  if (!turn.results.has('get_design_context'))
    return {
      say: `Demo mode: no AI is running. I’ll replay a scripted build of the **${template.title}** template through the real DS-Ngr tools.`,
      call: { name: 'get_design_context', input: {} },
    };
  if (!turn.results.has('get_component')) return { call: { name: 'get_component', input: { name: mainComponent(source) } } };
  if (!turn.results.has('create_prototype')) return { call: { name: 'create_prototype', input: { title: template.title, source } } };

  const out = turn.results.get('create_prototype') as { error?: string; issues?: { severity: string }[] } | null;
  if (out?.error) return { say: `The canvas rejected the template: ${out.error}` };
  const errors = out?.issues?.filter((i) => i.severity === 'error').length ?? 0;
  const warnings = out?.issues?.filter((i) => i.severity === 'warning').length ?? 0;
  const checks = errors || warnings ? `The rule check reported ${errors} error(s) and ${warnings} warning(s).` : 'It passed every rule check.';
  return { say: `Built the **${template.title}** page: ${template.description} ${checks}\n\n${NO_EDITS}` };
}

const pause = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();
    setTimeout(resolve, ms);
  });

const usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
};

function stream(step: Step, signal?: AbortSignal): ReadableStream<LanguageModelV4StreamPart> {
  return new ReadableStream({
    async start(controller) {
      controller.enqueue({ type: 'stream-start', warnings: [] });
      if (step.say) {
        controller.enqueue({ type: 'text-start', id: 't' });
        // Word by word, so the demo shows streaming the way a model would.
        for (const chunk of step.say.match(/\S+\s*/g) ?? []) {
          if (signal?.aborted) break;
          controller.enqueue({ type: 'text-delta', id: 't', delta: chunk });
          await pause(25, signal);
        }
        controller.enqueue({ type: 'text-end', id: 't' });
      }
      if (step.call) {
        await pause(300, signal);
        controller.enqueue({ type: 'tool-call', toolCallId: `demo-${crypto.randomUUID()}`, toolName: step.call.name, input: JSON.stringify(step.call.input) });
      }
      controller.enqueue({ type: 'finish', usage, finishReason: { unified: step.call ? 'tool-calls' : 'stop', raw: undefined } });
      controller.close();
    },
  });
}

export function demoModel(): LanguageModel {
  const model: LanguageModelV4 = {
    specificationVersion: 'v4',
    provider: 'ds-ngr-demo',
    modelId: 'script',
    supportedUrls: {},
    doGenerate: () => Promise.reject(new Error('The demo model only streams.')),
    doStream: async (options: LanguageModelV4CallOptions) => ({
      stream: stream(nextStep(readTurn(options.prompt, (options.tools ?? []).map((t) => t.name))), options.abortSignal),
    }),
  };
  return model;
}
