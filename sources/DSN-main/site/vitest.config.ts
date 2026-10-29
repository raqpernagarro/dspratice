import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Node-side tests for the knowledge layer and prototype compiler. Run from site/ so REPO_ROOT resolves to the repo.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: [
      { find: /^@\//, replacement: here('./') },
      { find: 'server-only', replacement: here('./lib/test/server-only.ts') },
    ],
  },
});
