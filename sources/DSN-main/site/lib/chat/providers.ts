import 'server-only';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';
import { ServiceError } from '@/lib/prototype/service';
import { MODELS, type KeySource, type Provider } from './models';
import { demoModel } from './demo';
import { getOrgModel } from './org';

export interface ModelRequest {
  source: KeySource;
  provider?: Provider;
  model?: string;
  /** Browser-held key, forwarded for this request only. */
  apiKey?: string | null;
}

/** The model for one chat request. Keys are used in memory and never stored. */
export function resolveModel({ source, provider, model, apiKey }: ModelRequest): LanguageModel {
  if (source === 'org') return getOrgModel();
  if (source === 'demo') return demoModel();
  const p: Provider = source === 'openrouter' ? 'openrouter' : provider ?? 'anthropic';
  if (!(p in MODELS)) throw new ServiceError(400, `Unknown provider "${p}".`);
  if (source === 'key' && p === 'openrouter') throw new ServiceError(400, 'Use source "openrouter" for OpenRouter keys.');
  if (!apiKey) throw new ServiceError(401, 'Add your API key first.');
  const id = model?.trim() || MODELS[p][0].value;
  switch (p) {
    case 'anthropic':
      return createAnthropic({ apiKey })(id);
    case 'openai':
      return createOpenAI({ apiKey })(id);
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(id);
    case 'openrouter':
      return createOpenRouter({ apiKey, appName: 'DS-Ngr' })(id);
  }
}
