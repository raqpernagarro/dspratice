// End-to-end checks in Microsoft Edge (the installed browser, via channel 'msedge'; nothing is
// downloaded). The internal hub runs on the dev server (4300); the client-safe demo build is
// served from dist-demo (4302), so run `npm run build:demo` first. Screenshots go to
// E2E_SHOTS (default test-results/shots).
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4300', channel: 'msedge', viewport: { width: 1440, height: 900 }, acceptDownloads: true, trace: 'retain-on-failure' },
  webServer: [
    { command: 'npm run dev', url: 'http://localhost:4300/api/status', reuseExistingServer: true, timeout: 60_000 },
    { command: 'npm run preview:demo', url: 'http://localhost:4302', reuseExistingServer: true, timeout: 60_000 },
  ],
})
