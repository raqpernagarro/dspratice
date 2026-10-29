import { APICallError, convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { toolContextFor } from '@/lib/mcp/context';
import { ServiceError } from '@/lib/prototype/service';
import { isKeySource, isProvider, KEY_HEADER } from '@/lib/chat/models';
import { getOrgUser, getQuota, orgConfigured } from '@/lib/chat/org';
import { resolveModel } from '@/lib/chat/providers';
import { COMPONENT_SYSTEM } from '@/lib/chat/component-system';
import { CUSTOMIZE_SYSTEM } from '@/lib/chat/customize-system';
import { getIndex, getSkill } from '@/lib/ds-knowledge';
import { CHAT_SYSTEM } from '@/lib/chat/system';
import { skillSystem } from '@/lib/chat/skill-system';
import { toAiTools } from '@/lib/chat/tools';

/**
 * In-site chat. The same tools as /api/mcp, driven by a model chosen per request:
 *   source "key"         the user's own Anthropic / OpenAI / Gemini key
 *   source "openrouter"  the key from OpenRouter sign-in
 *   source "org"         the company key (signed-in users, daily quota)
 * Browser-held keys arrive in the x-ai-key header, are used for this request
 * only, and are never stored or logged.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MAX_STEPS = 12;

interface ChatBody {
  messages: UIMessage[];
  source?: unknown;
  provider?: unknown;
  model?: unknown;
  theme?: string;
  brand?: string;
  kit?: string;
  kitKey?: string;
  /** "component" drafts kit components (/components/new), "customize" layers on one (/components/[slug]/customize); default draws prototypes. */
  mode?: unknown;
  /** The DS-Ngr component being customized, in "customize" mode. */
  component?: unknown;
  /** A repo skill (skills/<slug>/SKILL.md) to run, in prototype mode. */
  skill?: unknown;
}

const fail = (status: number, error: string) => Response.json({ error }, { status });

/** A provider error the user can act on, without echoing request details. */
function describeError(err: unknown): string {
  if (APICallError.isInstance(err)) {
    if (err.statusCode === 401 || err.statusCode === 403) return 'The provider rejected the key. Check it, or paste a new one.';
    if (err.statusCode === 404) return 'The provider does not know that model. Pick another one.';
    if (err.statusCode === 429) return 'The provider is rate-limiting this key, or it is out of credit. Try again shortly.';
    return `The provider returned an error${err.statusCode ? ` (${err.statusCode})` : ''}.`;
  }
  if (err instanceof ServiceError) return err.message;
  return 'Something went wrong while generating the reply.';
}

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return fail(400, 'Invalid JSON body.');
  }
  if (!Array.isArray(body.messages)) return fail(400, 'messages is required.');
  const source = isKeySource(body.source) ? body.source : 'key';

  const params = new URLSearchParams();
  for (const k of ['theme', 'brand', 'kit', 'kitKey'] as const) if (body[k]) params.set(k === 'kitKey' ? 'key' : k, body[k]!);
  const ctx = await toolContextFor(new URL(req.url).origin, params);
  if (ctx instanceof Response) return ctx;

  let userId: string | null = null;
  try {
    if (source === 'org') {
      if (!orgConfigured()) throw new ServiceError(503, 'The company key is not configured on this server yet.');
      const user = await getOrgUser(req);
      if (!user) throw new ServiceError(401, 'Sign in with your Nagarro account to use the company key.');
      await getQuota().check(user.id);
      userId = user.id;
    }
    const model = resolveModel({
      source,
      provider: isProvider(body.provider) ? body.provider : undefined,
      model: typeof body.model === 'string' ? body.model : undefined,
      apiKey: req.headers.get(KEY_HEADER),
    });
    const mode = body.mode === 'component' || body.mode === 'customize' ? body.mode : 'prototype';
    const tools = toAiTools(ctx, mode);
    const focus = typeof body.component === 'string' && getIndex().components[body.component] ? body.component : null;
    const skill = mode === 'prototype' && typeof body.skill === 'string' ? getSkill(body.skill) : null;
    const system =
      skill
        ? skillSystem(skill)
        : mode === 'customize'
        ? `${CUSTOMIZE_SYSTEM}${focus ? `\n\nThe user is customizing ${focus}.` : ''}`
        : mode === 'component'
          ? COMPONENT_SYSTEM
          : CHAT_SYSTEM;
    const result = streamText({
      model,
      system,
      messages: await convertToModelMessages(body.messages, { tools, ignoreIncompleteToolCalls: true }),
      tools,
      stopWhen: stepCountIs(MAX_STEPS),
      abortSignal: req.signal,
      onEnd: async ({ totalUsage }) => {
        if (userId) await getQuota().record(userId, totalUsage.totalTokens ?? 0);
      },
    });
    return result.toUIMessageStreamResponse({ onError: describeError });
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.status, err.message);
    throw err;
  }
}
