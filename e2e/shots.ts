import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'

const dir = process.env.E2E_SHOTS ?? 'test-results/shots'
mkdirSync(dir, { recursive: true })

/** Saves a screenshot for the manual review pass (Edge). */
export async function shot(page: Page, name: string, fullPage = false) {
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage })
}
