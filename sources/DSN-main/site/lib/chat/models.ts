/**
 * Key sources and model suggestions for the in-site chat. Shared by the chat
 * UI and /api/chat. Lists are suggestions: every picker also accepts a typed id.
 */

/** "demo" is the keyless scripted source (lib/chat/demo.ts). */
export type KeySource = 'key' | 'openrouter' | 'org' | 'demo';
export type Provider = 'anthropic' | 'openai' | 'google' | 'openrouter';

export const BYOK_PROVIDERS: { value: Exclude<Provider, 'openrouter'>; label: string; keyHint: string; keyUrl: string }[] = [
  { value: 'anthropic', label: 'Anthropic', keyHint: 'sk-ant-…', keyUrl: 'https://console.anthropic.com/settings/keys' },
  { value: 'openai', label: 'OpenAI', keyHint: 'sk-…', keyUrl: 'https://platform.openai.com/api-keys' },
  { value: 'google', label: 'Google Gemini', keyHint: 'AIza…', keyUrl: 'https://aistudio.google.com/app/apikey' },
];

export const MODELS: Record<Provider, { value: string; label: string }[]> = {
  anthropic: [
    { value: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
    { value: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
    { value: 'claude-haiku-5-5', label: 'Claude Haiku 5.5' },
  ],
  openai: [
    { value: 'gpt-5', label: 'GPT-5' },
    { value: 'gpt-5-mini', label: 'GPT-5 mini' },
  ],
  google: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ],
  openrouter: [
    { value: 'anthropic/claude-sonnet-5.5', label: 'Claude Sonnet 5.5' },
    { value: 'openai/gpt-5', label: 'GPT-5' },
    { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ],
};

export const isProvider = (v: unknown): v is Provider => typeof v === 'string' && v in MODELS;
export const isKeySource = (v: unknown): v is KeySource => v === 'key' || v === 'openrouter' || v === 'org' || v === 'demo';

/** Header that carries a browser-held key to /api/chat. Never in the URL or body. */
export const KEY_HEADER = 'x-ai-key';
