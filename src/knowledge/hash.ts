// Synchronous, dependency-free hashing that gives the same answer in Node, jsdom and browsers.
// FNV-1a over UTF-16 code units in two lanes with different seeds; 16 hex characters.

export function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\s+$/g, '').trim()
}

function fnv(text: string, seed: number): number {
  let h = seed >>> 0
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

export function hashText(text: string): string {
  const t = normalizeText(text)
  return fnv(t, 0x811c9dc5).toString(16).padStart(8, '0') + fnv(t, 0x050c5d1f).toString(16).padStart(8, '0')
}

export function hashJson(value: unknown): string {
  return hashText(JSON.stringify(value))
}

export function shortHash(text: string): string {
  return hashText(text).slice(0, 8)
}
