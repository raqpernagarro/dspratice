// The client demo in Edge, as a presenter would run it: start from the hub, jump straight to later
// chapters, keyboard control, the notes window in its own popup, no notes on the shared screen,
// reset, Back to preparation, and reduced motion.
import { expect, test } from '@playwright/test'
import { shot } from './shots'

test('present the client demo from the hub and get back to preparation', async ({ page, context }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/nagarro/demos/prepare?project=demo-brand')
  await page.getByTestId('prep-present').click()
  await expect(page).toHaveURL(/\/client\/demo-brand$/)
  const bar = page.locator('.demobar')
  await expect(page.locator('.demobar__headline')).toContainText('drift apart')
  await expect(page.locator('.demo-notice')).toContainText('Demonstration')
  await shot(page, '30-demo-challenge')

  // nothing private on the shared screen
  for (const t of ['On screen:', 'Points to make', 'Say it plainly', 'Open with the problem']) await expect(page.locator('body')).not.toContainText(t)

  // the notes window opens separately and follows the chapters
  const [notes] = await Promise.all([context.waitForEvent('page'), page.getByTestId('open-notes').click()])
  await notes.waitForLoadState()
  await expect(notes.locator('.notes-window')).toContainText('Open with the problem, not the tool')

  // jump straight to chapter 5: the fix is set up first, so the impact page opens
  await page.getByTestId('demo-chapters').click()
  await page.getByTestId('demo-chapter-fix').click()
  await expect(page).toHaveURL(/\/improve\/.+\/impact$/)
  await expect(page.locator('.demobar__setup')).toContainText('A fix has been proposed')
  await expect(notes.locator('.notes-window')).toContainText('Before anything merges')
  await shot(page, '31-demo-fix')

  // chapter 6 entered directly; "Show me" merges in one go
  await page.getByTestId('demo-chapters').click()
  await page.getByTestId('demo-chapter-review').click()
  await expect(page).toHaveURL(/\/improve\/pr\/\d+$/)
  await page.getByTestId('demo-show-me').click()
  await expect(page.getByTestId('demo-show-me')).toHaveCount(0)
  await shot(page, '32-demo-review')

  // keyboard: → next chapter (from 6, the short path continues at 7), ← back
  await page.locator('body').click({ position: { x: 5, y: 300 } })
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.demobar__headline')).toContainText('real components')
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.demobar__headline')).toContainText('affects')

  // the notes window drives the demo
  await notes.getByRole('button', { name: /Next/ }).click()
  await expect(page.locator('.demobar__headline')).toContainText('real components')

  // the last chapter: outcome and the next conversation
  await page.getByTestId('demo-chapters').click()
  await page.getByTestId('demo-chapter-outcome').click()
  await expect(page).toHaveURL(/\/evidence\/outcome$/)
  await expect(page.locator('main')).toContainText('The next conversation')
  await expect(page.locator('main')).toContainText('This is an example')
  await shot(page, '33-demo-outcome', true)

  // reset the demo, then back to preparation lands where we started
  await page.getByTestId('demo-more').click()
  await page.getByRole('menuitem', { name: /Reset the demo/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Reset the demo' }).click()
  await page.getByTestId('back-to-preparation').click()
  await expect(page).toHaveURL(/\/nagarro\/demos\/prepare\?project=demo-brand$/)
  await expect(bar).toHaveCount(0)
  expect(errors).toEqual([])
})

test('reduced motion: no running animations in the demo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/nagarro')
  await page.getByTestId('header-present').click()
  await page.getByRole('link', { name: 'Start the guided demo' }).first().click()
  await expect(page.locator('.demobar__headline')).toBeVisible()
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && (a.effect as KeyframeEffect | null)?.getTiming().duration !== 0 && Number((a.effect as KeyframeEffect | null)?.getTiming().duration) > 1).length)
  expect(running).toBe(0)
})
