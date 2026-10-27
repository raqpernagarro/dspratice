// Projects in Edge: one page, My work. What you left unfinished, then every project in this browser
// with a live preview of its own system; a card edit (status, a real link) shows at once; the old
// list pages land here. No team board: projects are not shared between people (NDA).
import { expect, test } from '@playwright/test'
import { shot } from './shots'

test('projects: my work, live previews, a card edit, old pages land here', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/nagarro')
  await page.locator('.shell__side .nav__label', { hasText: 'Projects' }).click()
  await expect(page).toHaveURL(/\/nagarro\/work$/)
  await expect(page.locator('.area-tabs__tab')).toHaveCount(0)
  await expect(page.getByTestId('continue-list')).toBeVisible()
  const grid = page.getByTestId('my-projects')
  for (const name of ['Demo Brand', 'Northwind Retail', 'Contoso Bank', 'Fabrikam Health']) await expect(grid).toContainText(name)
  await expect(grid).not.toContainText('ASSA ABLOY')
  // each tile previews the project's own system on real components
  await expect(page.getByTestId('tile-northwind').locator('.ptile__preview .ds-button').first()).toBeVisible()
  await expect(page.getByTestId('tile-contoso').locator('a[aria-label^="Figma"]')).toHaveCount(0)
  await shot(page, '30-my-work')

  // edit Northwind's card: paused, with a real Figma link
  await page.getByTestId('tile-menu-northwind').click()
  await page.getByRole('menuitem', { name: /Edit the card/ }).click()
  await page.getByTestId('card-status').selectOption('paused')
  await page.getByTestId('card-link-figma').fill('https://www.figma.com/design/abc123/Northwind-UI')
  await page.getByTestId('save-card').click()
  const northwind = page.getByTestId('tile-northwind')
  await expect(northwind).toContainText('Paused')
  await expect(northwind.locator('a[aria-label="Figma for Northwind Retail"]')).toHaveAttribute('href', 'https://www.figma.com/design/abc123/Northwind-UI')

  // the old list pages land on My work
  for (const old of ['/nagarro/clients', '/nagarro/opportunities', '/nagarro/presentations']) {
    await page.goto(old)
    await expect(page).toHaveURL(/\/nagarro\/work$/)
  }

  expect(errors).toEqual([])
})
