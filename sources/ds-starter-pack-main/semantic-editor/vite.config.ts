import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { readFileSync, writeFileSync } from 'node:fs'

import { planStatus, runOnPlan } from './bridge/claudePlan'
import { PRODUCT } from './src/config/product'
import { PLAN_RUN_URL, PLAN_STATUS_URL, type PlanRunRequest } from './src/agent/planProtocol'
import { parseProjectFile } from '../stories/base-ui/tokens/project-file'

const editorRoot = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(editorRoot, '..')

/** Fills %PRODUCT_*% placeholders in index.html from src/config/product.ts. */
function productHtml(): Plugin {
  return {
    name: 'product-html',
    transformIndexHtml: (html) =>
      html
        .replaceAll('%PRODUCT_NAME%', PRODUCT.name)
        .replaceAll('%PRODUCT_TAGLINE%', PRODUCT.tagline),
  }
}

/**
 * Dev server only: lets the configurator save the system to the repo.
 *   GET  /__ds/status   → { writable: true }
 *   POST /__ds/project  → checks the project file and writes ds.project.json at the repo root
 * A static build has no such endpoint, so the app falls back to downloading the file.
 */
function saveToRepo(): Plugin {
  return {
    name: 'ds-save-to-repo',
    apply: 'serve',
    configureServer(server) {
      // ds.project.json lives at the repo root, outside the editor's root, so Vite doesn't watch it.
      // When it appears or changes (Save, or `npm run ds:apply-project`), re-read it and reload.
      const projectFile = path.resolve(repoRoot, 'ds.project.json')
      const committedModule = path.resolve(repoRoot, 'stories/base-ui/tokens/committed-project.ts')
      const refresh = () => {
        for (const mod of server.moduleGraph.getModulesByFile(committedModule) ?? []) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      // `npm run ds:reset` writes .ds-reset: open editors reload and forget what they saved.
      const resetFile = path.resolve(repoRoot, '.ds-reset')
      server.watcher.add(resetFile)
      server.watcher.on('add', (f) => f === resetFile && server.ws.send({ type: 'full-reload' }))
      server.watcher.on('change', (f) => f === resetFile && server.ws.send({ type: 'full-reload' }))
      server.middlewares.use('/__ds/reset', (_req, res) => {
        let stamp: string | null = null
        try {
          stamp = (JSON.parse(readFileSync(resetFile, 'utf8')) as { stamp?: string }).stamp ?? null
        } catch {
          // No reset yet.
        }
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ stamp }))
      })
      server.watcher.add(projectFile)
      server.watcher.on('add', (f) => f === projectFile && refresh())
      server.watcher.on('change', (f) => f === projectFile && refresh())
      server.watcher.on('unlink', (f) => f === projectFile && refresh())

      server.middlewares.use('/__ds/status', (_req, res) => {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ writable: true }))
      })
      server.middlewares.use('/__ds/project', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            const file = parseProjectFile(body)
            writeFileSync(path.resolve(repoRoot, 'ds.project.json'), JSON.stringify(file, null, 2) + '\n')
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ ok: true, path: 'ds.project.json' }))
          } catch (e) {
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }))
          }
        })
      })
    },
  }
}

/**
 * Dev server only: runs the agent on the user's own Claude plan (Claude Code login on this computer).
 *   GET  /__ds/agent/status → is Claude Code here and logged in
 *   POST /__ds/agent/run    → streams the run back, one JSON event per line
 * Never in the production build: a published site connects with an API key instead.
 */
function claudePlanBridge(): Plugin {
  return {
    name: 'ds-claude-plan',
    apply: 'serve',
    configureServer(server) {
      // Only the editor's own pages may use the plan: no other site, not even another local one.
      // "null" (sandboxed frames, data: pages) or any origin that isn't a URL counts as foreign.
      const sameOrigin = (req: import('node:http').IncomingMessage) => {
        const origin = req.headers.origin
        if (!origin) return true
        try {
          return new URL(origin).host === req.headers.host
        } catch {
          return false
        }
      }
      server.middlewares.use(PLAN_STATUS_URL, async (req, res) => {
        if (!sameOrigin(req)) {
          res.statusCode = 403
          res.end()
          return
        }
        res.setHeader('content-type', 'application/json')
        res.setHeader('cache-control', 'no-store')
        try {
          res.end(JSON.stringify(await planStatus()))
        } catch {
          res.end(JSON.stringify({ installed: false, loggedIn: false }))
        }
      })
      server.middlewares.use(PLAN_RUN_URL, (req, res) => {
        if (req.method !== 'POST' || !sameOrigin(req) || !req.headers['content-type']?.startsWith('application/json')) {
          res.statusCode = req.method !== 'POST' ? 405 : 403
          res.end()
          return
        }
        // A run request is a prompt and a few tool schemas: anything bigger isn't the editor.
        const MAX_BODY = 2 * 1024 * 1024
        let body = ''
        let tooBig = false
        req.on('data', (chunk) => {
          if (tooBig) return
          body += chunk
          if (body.length > MAX_BODY) {
            tooBig = true
            res.statusCode = 413
            res.end()
            req.destroy()
          }
        })
        req.on('end', async () => {
          if (tooBig) return
          let run: PlanRunRequest
          try {
            run = JSON.parse(body) as PlanRunRequest
          } catch {
            res.statusCode = 400
            res.end()
            return
          }
          const abort = new AbortController()
          res.on('close', () => abort.abort())
          res.setHeader('content-type', 'application/x-ndjson')
          res.setHeader('cache-control', 'no-store')
          try {
            for await (const event of runOnPlan(run, abort.signal)) {
              if (abort.signal.aborted) break
              res.write(JSON.stringify(event) + '\n')
            }
          } catch (e) {
            // Never let a failed run take the dev server down: tell the editor instead.
            res.write(JSON.stringify({ type: 'error', code: 'failed', message: e instanceof Error ? e.message : String(e) }) + '\n')
          }
          res.end()
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), productHtml(), saveToRepo(), claudePlanBridge()],
  root: editorRoot,
  server: {
    port: 4175,
    open: true,
    fs: {
      allow: [repoRoot],
    },
  },
  resolve: {
    alias: {
      '@ds-tokens': path.resolve(repoRoot, 'stories/base-ui/tokens'),
    },
  },
})
