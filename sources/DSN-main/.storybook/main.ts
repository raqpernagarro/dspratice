import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';
import { fileURLToPath } from 'node:url';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/stories/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'
  ],
  addons: [{
    name: '@storybook/addon-docs',
    options: {
      mdxPluginOptions: {
        mdxCompileOptions: {
          remarkPlugins: [remarkGfm],
        },
      },
    },
  }, '@storybook/addon-a11y', '@storybook/addon-mcp'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  features: {
    componentsManifest: true,
  },
  viteFinal: async (config) => {
    config.optimizeDeps = {
      ...config.optimizeDeps,
      exclude: [
        ...(config.optimizeDeps?.exclude || []),
        '@tpitre/story-ui'
      ]
    };
  
    // Allow ?raw imports for .md files
    config.assetsInclude = [
      ...(Array.isArray(config.assetsInclude) ? config.assetsInclude : []),
      '**/*.md'
    ];

    // templates/*.jsx import from 'ds-ngr' exactly as a consuming app would; resolve it to the source.
    config.resolve = {
      ...config.resolve,
      alias: [
        ...(Array.isArray(config.resolve?.alias)
          ? config.resolve.alias
          : Object.entries(config.resolve?.alias ?? {}).map(([find, replacement]) => ({ find, replacement: replacement as string }))),
        { find: /^ds-ngr$/, replacement: fileURLToPath(new URL('../src/index.ts', import.meta.url)) },
      ],
    };

    return config;
  },
};

export default config;
