import type { NextConfig } from 'next';
import path from 'node:path';

// The site renders DS-Ngr straight from ../src so it is always in sync with
// the current commit — no publish step between the library and its docs.
const repoRoot = path.resolve(process.cwd(), '..');

const nextConfig: NextConfig = {
  turbopack: { root: repoRoot },
  // Library types are owned by the root `npm run typecheck`; pre-existing errors
  // there must not block a docs deploy. Site code is checked by `site/ typecheck`.
  typescript: { ignoreBuildErrors: true },
  outputFileTracingRoot: repoRoot,
  // Knowledge sources read at runtime by lib/ds-knowledge (MCP + chat routes).
  outputFileTracingIncludes: {
    '/**': ['../ds-index.json', '../tokens.css', '../AI.md', '../AI-short.md', '../specs/**/*.md', '../templates/**', '../skills/**/*.md', '../src/components/**/*.spec.md', '../src/components/**/*.{ts,tsx}', '../src/types/**/*.ts'],
    // Starter pack download: app template + packed ds-ngr (scripts/build-starter-assets.mjs).
    '/api/starter': ['../starter/template/**/*', './.starter/**/*', './public/cli/**/*'],
  },
  compiler: {
    styledComponents: true,
    // Library source uses Vite's import.meta.env.DEV for dev-only warnings.
    define: { 'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV !== 'production') },
  },
  // Built Storybook lives in public/storybook. Redirect (not rewrite) so its
  // relative asset URLs resolve under /storybook/.
  async redirects() {
    return [
      { source: '/storybook', destination: '/storybook/index.html', permanent: false },
      { source: '/storybook/', destination: '/storybook/index.html', permanent: false },
      // The styleguide visuals now live inside the foundation guides.
      { source: '/foundations/styleguide', destination: '/guides/colors', permanent: true },
      { source: '/themes', destination: '/brands', permanent: true },
      { source: '/customize', destination: '/brands', permanent: true },
    ];
  },
};

export default nextConfig;
