import React from 'react';
import type { Preview, Decorator } from '@storybook/react-vite';
import '../src/styles/global.css';
import { DsDocsPage } from './DsDocsPage';

const STORYBOOK_THEME_STYLE_ID = 'dsn-storybook-theme-surface';

function ensureStorybookThemeSurfaceStyles() {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.getElementById(STORYBOOK_THEME_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STORYBOOK_THEME_STYLE_ID;
  style.textContent = `
    /* Keep Storybook docs/canvas containers aligned with DS theme tokens */
    html, body, #storybook-root,
    .sb-show-main, .sb-main-padded,
    .sbdocs, .sbdocs-wrapper, .sbdocs-content,
    .docs-story, .docs-story > div,
    .sb-unstyled {
      background: var(--color-background-neutral-primary) !important;
      color: var(--color-foreground-neutral-primary) !important;
    }

    /* Storybook sets explicit color on docs headings/paragraphs — override them */
    .sbdocs h1, .sbdocs h2, .sbdocs h3, .sbdocs h4, .sbdocs h5, .sbdocs h6,
    .sbdocs p, .sbdocs li, .sbdocs td, .sbdocs th,
    .sbdocs-h1, .sbdocs-h2, .sbdocs-h3, .sbdocs-h4,
    .sbdocs-p, .sbdocs-a,
    [class*="PropsTable"], [class*="Title"], [class*="Subtitle"] {
      color: var(--color-foreground-neutral-primary) !important;
    }

    /* Full-width story frame — list rows, section headers, bars that span the canvas */
    .sb-show-main.sb-main-centered #storybook-root:has(.dsn-story-width-full) {
      width: 100%;
      max-width: 100%;
    }
    .dsn-story-width-full {
      box-sizing: border-box;
      width: 100%;
      max-width: 100%;
    }

    /* Override Storybook's hardcoded code/pre backgrounds */
    code, pre,
    .docblock-source,
    .docblock-argstable,
    .docblock-argstable-head,
    .docblock-argstable-body tr {
      background: var(--color-background-neutral-secondary) !important;
      color: var(--color-foreground-neutral-primary) !important;
      border-color: var(--color-border-neutral-primary) !important;
    }
  `;

  document.head.appendChild(style);
}

// ─── Theme decorator ──────────────────────────────────────────────────────────
// Sets `data-theme` on <html> so every CSS `[data-theme="dark"]` override in
// tokens.css takes effect.  Runs synchronously before render — no hooks needed.
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals['theme'] as string) ?? 'light';
  document.documentElement.setAttribute('data-theme', theme);
  // Also propagate to the parent shell — Storybook docs headings/body text
  // render in the manager frame, not the preview iframe.
  try { window.parent.document.documentElement.setAttribute('data-theme', theme); } catch (_) {}
  ensureStorybookThemeSurfaceStyles();
  return Story();
};

// ─── Story width decorator ────────────────────────────────────────────────────
// Stories are centred (`layout: 'centered'`), which shrinks the canvas to the content's width.
// Fluid components have no width of their own, so they set `parameters.storyWidth`
// and render inside a frame (`field` / `container` centred, or `full` edge-to-edge).
export const STORY_WIDTH = { field: 360, container: 560 } as const;
export type StoryWidth = keyof typeof STORY_WIDTH | 'full';

const withStoryWidth: Decorator = (Story, context) => {
  const width = context.parameters.storyWidth as StoryWidth | undefined;
  if (!width || context.parameters.layout !== 'centered') return Story();
  if (width === 'full') return <div className="dsn-story-width-full">{Story()}</div>;
  if (!(width in STORY_WIDTH)) return Story();
  return <div style={{ width: STORY_WIDTH[width as keyof typeof STORY_WIDTH], maxWidth: '100%' }}>{Story()}</div>;
};

// ─── Preview config ───────────────────────────────────────────────────────────

const preview: Preview = {
  decorators: [withStoryWidth, withTheme],

  // Toolbar toggle — adds a ☀ / 🌙 button next to the existing controls
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Switch between light and dark theme',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light mode' },
          { value: 'dark', icon: 'moon', title: 'Dark mode' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },

  parameters: {
    options: {
      storySort: {
        order: ['Guidelines', ['Welcome', 'Styleguide', 'Design tokens', 'Consumer guide', 'Builder guide'], 'Patterns', ['Docs', 'App Shell'], '*'],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Every story is centred, so Storybook and the docs-site playground look the same.
    // Full-width components (tables, charts, app shell) opt out with `layout: 'padded'` / `'fullscreen'`.
    layout: 'centered',
    // Disable Storybook's backgrounds addon — the DS theme toggle (data-theme)
    // controls canvas background via var(--color-background-neutral-primary).
    backgrounds: { disabled: true },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
        ],
      },
    },
    docs: {
      page: DsDocsPage,
    },
  },

  initialGlobals: {
    theme: 'light',
  }
};

export default preview;
