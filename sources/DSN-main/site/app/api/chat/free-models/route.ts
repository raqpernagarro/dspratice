import { freeToolModels, OPENROUTER_MODELS_URL } from '@/lib/chat/free-models';

/** Free, tool-capable OpenRouter models for the chat's model picker. Public data, refreshed hourly. */

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(OPENROUTER_MODELS_URL, { next: { revalidate } });
    if (!res.ok) return Response.json([]);
    return Response.json(freeToolModels(await res.json()));
  } catch {
    return Response.json([]);
  }
}
