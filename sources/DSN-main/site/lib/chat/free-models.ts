/**
 * OpenRouter's free models that can call tools — the chat needs tool calls to
 * draw anything. Free models only need an OpenRouter sign-in, no credit.
 */

export const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

interface OpenRouterModel {
  id: string;
  name?: string;
  pricing?: { prompt?: string; completion?: string };
  supported_parameters?: string[];
}

const isZero = (price: string | undefined) => price !== undefined && Number(price) === 0;

export function freeToolModels(data: unknown): { value: string; label: string }[] {
  const list = (data as { data?: OpenRouterModel[] } | null)?.data;
  if (!Array.isArray(list)) return [];
  return list
    .filter((m) => typeof m?.id === 'string' && isZero(m.pricing?.prompt) && isZero(m.pricing?.completion) && m.supported_parameters?.includes('tools'))
    .map((m) => ({ value: m.id, label: `${(m.name ?? m.id).replace(/\s*\(free\)\s*$/i, '')} · free` }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
