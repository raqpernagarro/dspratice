import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      exclude: ['**/*.stories.tsx', '**/*.test.tsx', 'src/test/**', 'src/stories/templates.d.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DSNgr',
      fileName: (format) => `ds-ngr.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'styled-components',
        /^storybook/,
        /^@storybook/,
        /^@visx/,
        /^d3/,
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'styled-components': 'styled',
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // site/ has its own vitest config (server-only knowledge layer); run it with `npm test --workspace site`.
    exclude: ['**/node_modules/**', '**/.claude/worktrees/**', 'site/**'],
    // templates/*.jsx import 'ds-ngr' like a consuming app; resolve it to the source under test.
    alias: { 'ds-ngr': resolve(__dirname, 'src/index.ts') },
  },
});