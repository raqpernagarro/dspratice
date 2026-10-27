// Engagement in Edge: the posts board shows Nuno's Starter Pack posts grouped by format, each linked
// to FigJam; "Make a post" on a social cut starts a draft that can be edited; any post can be sent
// to Marketing Studio as a command; the Marketing Studio tab says whether TryPost runs and how to set it up.
import { expect, test } from '@playwright/test'
import { shot } from './shots'

test('engagement: posts board, a draft from a social cut, the Marketing Studio hand-off', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/nagarro/engagement')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Engagement')
  // the calendar opens first; with no Marketing Studio folder set, it says how to connect one,
  // and the tray holds Nuno's Starter Pack posts (they have no dates yet)
  await expect(page.getByTestId('cal-grid')).toBeVisible()
  await expect(page.getByTestId('cal-setup')).toContainText('MARKETING_STUDIO_FOLDERS')
  await expect(page.getByTestId('cal-tray')).toContainText('Drift has a number')
  await shot(page, '50-engagement-calendar')

  // Posts: Nuno's board, grouped by format, each linked to FigJam
  await page.getByRole('button', { name: 'Posts', exact: true }).click()
  await expect(page.locator('.post-group').first()).toContainText('Videos · 15')
  await expect(page.getByTestId('post-ds-16')).toContainText('Drift has a number')
  await expect(page.getByTestId('post-ds-16').getByRole('link', { name: /Open in FigJam/ })).toHaveAttribute('href', /node-id=523-1527$/)
  await expect(page.locator('main')).not.toContainText('For the Nagarro Design page')

  // Social cuts moved here from Demos
  await page.getByRole('button', { name: 'Social cuts', exact: true }).click()
  await expect(page.getByTestId('social-cuts').locator('li')).toHaveCount(5)

  // a draft from a social cut
  await page.goto('/nagarro/engagement/cuts/a-fix-travels')
  await page.getByTestId('make-post').click()
  await expect(page).toHaveURL(/\/nagarro\/engagement/)
  await expect(page.getByTestId('post-text')).toHaveValue(/In the clip:/)
  await page.getByTestId('post-status').selectOption('in-review')
  await page.getByTestId('save-post').click()
  const draft = page.getByTestId('drafts').locator('.post').first()
  await expect(draft).toContainText('A fix travels from Figma to code')
  await expect(draft).toContainText('In review')
  await expect(draft.getByRole('link', { name: /Play the cut/ })).toHaveAttribute('href', '/nagarro/engagement/cuts/a-fix-travels')

  // the hand-off: Marketing Studio's own script, in its Nagarro mode
  await page.getByRole('button', { name: 'Posts', exact: true }).click()
  await page.getByTestId('send-ds-16').click()
  await page.getByTestId('studio-folder').fill('~/Claude/marketing-studio')
  await expect(page.getByTestId('studio-command')).toContainText('cd ~/"Claude/marketing-studio"')
  await expect(page.getByTestId('studio-command')).toContainText('python3 scripts/new_idea.py nd-drift-has-a-number --title "Drift has a number" --mode nagarro')
  await shot(page, '51-engagement-send')
  await page.keyboard.press('Escape')

  // the Marketing Studio tab: TryPost is not running here, so it shows the set-up
  await page.getByRole('button', { name: 'Marketing Studio', exact: true }).click()
  await expect(page).toHaveURL(/tab=studio/)
  await expect(page.getByTestId('trypost-status')).toContainText('not running')
  await expect(page.getByTestId('studio-install')).toContainText('sh trypost/setup.sh')
  await shot(page, '52-engagement-studio')

  expect(errors).toEqual([])
})
