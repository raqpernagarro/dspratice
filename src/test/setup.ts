import '@/internal/register'
import '@testing-library/jest-dom/vitest'

// structuredClone exists in Node 17+, jsdom environment keeps it; guard anyway.
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (v: unknown) => JSON.parse(JSON.stringify(v))
}
