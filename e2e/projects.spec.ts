// Projects in Edge: My work opens on what is unfinished and the projects I am on; the team board
// shows every item as a calm card, filters and groups by status, and a card edit (status, a real
// link) shows at once; a project's Requests & decks tab lists its work and adds more.
import { expect, test } from '@playwright/test'
import { shot } from './shots'

test('projects: my work, the team board, a card edit and a project’s requests and decks', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  // the sidebar's Projects opens My work
  await page.goto('/nagarro')
  await page.locator('.shell__side .nav__label', { hasText: 'Projects' }).click()
  await expect(page).toHaveURL(/\/nagarro\/work$/)
  await expect(page.locator('.area-tabs__tab')).toHaveText(['My work', 'Team board', 'Client requests', 'Presentations'])
  await expect(page.getByTestId('continue-list')).toBeVisible()
  await expect(page.getByTestId('my-projects').locator('.ptile').first()).toBeVisible()
  await shot(page, '30-my-work')

  // someone else's work: Nuno is only on Demo Brand
  await page.getByTestId('me-select').selectOption('nuno-almeida')
  await expect(page.getByTestId('my-projects').locator('.ptile')).toHaveCount(1)
  await expect(page.getByTestId('my-projects')).toContainText('Demo Brand')

  // the team board: sample projects, shared work and a sample opportunity side by side
  await page.goto('/nagarro/clients')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Team board')
  const grid = page.getByTestId('board-grid')
  for (const name of ['Demo Brand', 'Northwind Retail', 'Contoso Bank', 'Fabrikam Health', 'ASSA ABLOY', 'Litware Insurance']) await expect(grid).toContainText(name)
  // placeholder addresses in sample data never show as links
  await expect(page.getByTestId('tile-contoso').locator('a[aria-label^="Figma"]')).toHaveCount(0)
  await shot(page, '31-team-board')

  await page.getByTestId('board-status').selectOption('opportunity')
  await expect(grid.locator('.ptile')).toHaveCount(1)
  await expect(grid).toContainText('Litware Insurance')
  await page.getByTestId('board-status').selectOption('all')
  await page.getByTestId('board-person').selectOption('rui-dias')
  await expect(grid.locator('.ptile')).toHaveCount(1)
  await page.getByTestId('board-person').selectOption('')

  // edit Northwind's card: paused, with a real Figma link
  await page.getByTestId('tile-menu-northwind').click()
  await page.getByRole('menuitem', { name: /Edit the card/ }).click()
  await page.getByTestId('card-status').selectOption('paused')
  await page.getByTestId('card-link-figma').fill('https://www.figma.com/design/abc123/Northwind-UI')
  await page.getByTestId('save-card').click()
  const northwind = page.getByTestId('tile-northwind')
  await expect(northwind).toContainText('Paused')
  await expect(northwind.locator('a[aria-label="Figma for Northwind Retail"]')).toHaveAttribute('href', 'https://www.figma.com/design/abc123/Northwind-UI')

  // grouped by status, Northwind sits under Paused
  await page.getByRole('button', { name: 'By status' }).click()
  await expect(page.getByTestId('board-columns').getByRole('region', { name: 'Paused' })).toContainText('Northwind Retail')
  await shot(page, '32-team-board-columns')

  // a project's own requests and decks, with the two ways to add one
  await page.goto('/nagarro/clients/northwind/requests')
  await expect(page.locator('.project-tabs [aria-current="page"]')).toHaveText('Requests & decks')
  await expect(page.getByTestId('project-requests')).toContainText('Client request')
  await page.getByTestId('project-new-deck').click()
  await expect(page).toHaveURL(/\/nagarro\/presentations\/new\?project=northwind$/)
  await expect(page.getByTestId('deck-project')).toHaveValue('northwind')

  expect(errors).toEqual([])
})
