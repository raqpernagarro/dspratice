/**
 * OpenRouter sign-in (OAuth PKCE), entirely in the browser. The resulting key
 * is stored like a pasted key; our server only sees it per chat request.
 * https://openrouter.ai/docs/use-cases/oauth-pkce
 */

const VERIFIER = 'ds-ngr:openrouter-verifier';

const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function challengeFor(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

/** Where OpenRouter sends the user back. Must match on the exchange. */
export const callbackUrl = () => `${window.location.origin}/prototype/chat?source=openrouter`;

export async function startOpenRouterSignIn() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  sessionStorage.setItem(VERIFIER, verifier);
  const params = new URLSearchParams({
    callback_url: callbackUrl(),
    code_challenge: await challengeFor(verifier),
    code_challenge_method: 'S256',
  });
  window.location.assign(`https://openrouter.ai/auth?${params}`);
}

/** Trades the ?code= from the callback for a user-controlled OpenRouter key. */
export async function finishOpenRouterSignIn(code: string): Promise<string> {
  const verifier = sessionStorage.getItem(VERIFIER);
  if (!verifier) throw new Error('Sign-in expired. Start again.');
  const res = await fetch('https://openrouter.ai/api/v1/auth/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
  });
  sessionStorage.removeItem(VERIFIER);
  const data = (await res.json().catch(() => ({}))) as { key?: string };
  if (!res.ok || !data.key) throw new Error('OpenRouter did not return a key. Try signing in again.');
  return data.key;
}
