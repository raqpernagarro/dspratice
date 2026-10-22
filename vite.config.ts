import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { localApi } from './server/local-api'
import { fileURLToPath, URL } from 'node:url'
import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

// The two source libraries (DSN by Rui Dias, the DS Starter Pack by Nuno Almeida) are read-only
// reference material and OPTIONAL. They are aliased from their folders (never copied, never
// installed) and every dependency they share with the app is deduped so a single React runs
// everywhere. Lookup order: DSN_DIR / STARTER_DIR, ./sources/<name>, ../demo tools/<name>.
// When a library is missing, its preview frame shows "Library source not installed" and the rest
// of the app builds and runs unchanged (see optionalSources below and scripts/setup.mjs).
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))
function findSource(envVar: string, name: string): string {
  const candidates = [process.env[envVar], r(`./sources/${name}`), r(`../demo tools/${name}`)].filter(Boolean) as string[]
  return candidates.find((c) => existsSync(resolve(c, 'package.json'))) ?? candidates[candidates.length - 1]
}
export const DSN = findSource('DSN_DIR', 'DSN-main')
export const STARTER = findSource('STARTER_DIR', 'ds-starter-pack-main')
export const HAS_DSN = existsSync(resolve(DSN, 'src/index.ts'))
export const HAS_STARTER = existsSync(resolve(STARTER, 'stories/base-ui'))

/** Redirects the preview frame's library modules to a placeholder when their source is missing. */
function optionalSources(): Plugin {
  const missing = r('./src/preview/libs/missing.tsx')
  return {
    name: 'udt-optional-sources',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !importer.replace(/\\/g, '/').endsWith('/src/preview/main.tsx')) return null
      if (source === './libs/dsn' && !HAS_DSN) return missing
      if (source === './libs/starter' && !HAS_STARTER) return missing
      return null
    },
  }
}

export const libraryAlias = {
  '@': r('./src'),
  '@dsn': resolve(DSN, 'src'),
  '@dsn-theme': resolve(DSN, 'site/lib/theme'),
  '@dsn-root': DSN,
  '@dsn-templates': resolve(DSN, 'templates'),
  'ds-ngr': resolve(DSN, 'src/index.ts'),
  '@starter': resolve(STARTER, 'stories/base-ui'),
  '@ds-tokens': resolve(STARTER, 'stories/base-ui/tokens'),
}

export const dedupe = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'styled-components',
  'lucide-react',
  '@base-ui/react',
  '@phosphor-icons/react',
  'lexical',
  '@lexical/react',
  '@lexical/code',
  '@lexical/history',
  '@lexical/html',
  '@lexical/link',
  '@lexical/list',
  '@lexical/rich-text',
  '@lexical/selection',
  '@fullcalendar/core',
  '@fullcalendar/react',
  '@fullcalendar/daygrid',
  '@fullcalendar/timegrid',
  '@fullcalendar/list',
  '@fullcalendar/interaction',
  '@visx/axis',
  '@visx/brush',
  '@visx/group',
  '@visx/heatmap',
  '@visx/scale',
  '@visx/shape',
  '@visx/xychart',
  '@react-spring/web',
  'react-zoom-pan-pinch',
]

// Demo build (vite build --mode demo): the client-safe site. Internal routes and internal seed data
// are swapped for demo stand-ins at resolve time, so they never enter the bundle;
// scripts/check-demo-build.mjs then scans dist-demo/ for anything internal.
const demoAlias = (mode: string) =>
  mode === 'demo'
    ? [
        { find: /^@\/internal\/register$/, replacement: r('./src/internal/register.demo.ts') },
        { find: /^@\/app\/router$/, replacement: r('./src/app/router.demo.tsx') },
      ]
    : []

/** The demo build has no slides entry, so Carolina's vendored engine (whose template examples
 *  name real clients) is removed from the copied public folder, and the page gets a public title. */
function pruneDemoOutput(): Plugin {
  let outDir = ''
  return {
    name: 'prune-demo-output',
    apply: 'build',
    configResolved(c) {
      outDir = resolve(c.root, c.build.outDir)
    },
    transformIndexHtml(html) {
      return html.replace(/<title>[^<]*<\/title>/, '<title>AI-ready design systems · Nagarro demo</title>')
    },
    closeBundle() {
      rmSync(resolve(outDir, 'vendor'), { recursive: true, force: true })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), optionalSources(), localApi(r('.')), ...(mode === 'demo' ? [pruneDemoOutput()] : [])],
  define: { 'import.meta.env.VITE_TARGET': JSON.stringify(mode === 'demo' ? 'demo' : 'internal') },
  resolve: { alias: [...demoAlias(mode), ...Object.entries(libraryAlias).map(([find, replacement]) => ({ find, replacement }))], dedupe },
  server: { port: 4300, strictPort: true, fs: { allow: [r('.'), ...(HAS_DSN ? [DSN] : []), ...(HAS_STARTER ? [STARTER] : [])] } },
  optimizeDeps: {
    entries: ['index.html', 'preview.html', 'slides.html'],
    // Packages without a root export ("@lexical/react" only ships subpaths) cannot be pre-bundled whole.
    include: dedupe.filter((d) => !d.startsWith('react/') && d !== '@lexical/react'),
  },
  build: {
    rollupOptions: {
      input: (mode === 'demo' ? { main: r('./index.html') } : { main: r('./index.html'), preview: r('./preview.html'), slides: r('./slides.html') }) as Record<string, string>,
      output: {
        manualChunks(id) {
          if (/node_modules\/(lexical|@lexical)\//.test(id)) return 'vendor-lexical'
          if (id.includes('node_modules/@fullcalendar/')) return 'vendor-fullcalendar'
          if (/node_modules\/(@visx|d3-|@react-spring)\//.test(id)) return 'vendor-visx'
          if (id.includes('node_modules/@base-ui/')) return 'vendor-base-ui'
          if (id.includes('node_modules/mammoth/')) return 'vendor-mammoth'
          if (id.includes('node_modules/pdfjs-dist/')) return 'vendor-pdfjs'
        },
      },
    },
  },
}))
