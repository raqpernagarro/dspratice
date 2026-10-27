// Every journey on Home opens something that works, in Edge, on a machine with no practice tools
// running: a workspace page, a set-up guide, or a tool page that says how to start the tool.
import { expect, test } from '@playwright/test'

const JOURNEYS = ['respond-request', 'presentation', 'client-demo', 'ai-readiness', 'idea-deck', 'follow-up', 'shape-offer', 'new-system', 'improve-system', 'prototype', 'product-design', 'ai-ready-system', 'figma-code', 'project-update']

test('every journey on Home lands on a working page', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  for (const id of JOURNEYS) {
    await page.goto('/nagarro')
    await page.getByTestId('group-clients').getByRole('button', { name: /All \d+ journeys/ }).click()
    const sheet = page.getByRole('dialog')
    await sheet.getByRole('button', { name: 'All' }).click()
    await sheet.getByTestId(`journey-${id}`).click()
    await expect(page, id).not.toHaveURL(/\/nagarro$/)
    const main = page.locator('main')
    await expect(main.getByRole('heading', { level: 1 }), id).toBeVisible()
    // a practice tool either shows itself or the steps to start it
    if (page.url().includes('/nagarro/tools/')) await expect(main, id).toContainText(/npm run tools|Running|Open in its own tab|is not on this machine/)
  }
  expect(errors).toEqual([])
})
