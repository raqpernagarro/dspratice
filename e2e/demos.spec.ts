// Demos in Edge: the page leads with Prepare a client meeting; the meeting is made of outcomes, one by
// one (a presentation, a demo, your notes, the follow-up); a demo built from plain words becomes a
// playlist that the guide bar and the notes window both follow; ready-made demos present at once.
import { expect, test } from '@playwright/test'
import { shot } from './shots'

test('demos: prepare a client meeting, build a demo, present it with notes', async ({ page, context }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/nagarro/demos')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Show it working.')
  await expect(page.locator('.area-tabs__tab')).toHaveText(['Demos', 'Prepare a client meeting'])
  for (const id of ['ai-on-system', 'retheme', 'fix-travels', 'scorecard', 'meeting-story', 'full-story']) await expect(page.getByTestId(`mini-${id}`)).toBeVisible()
  await expect(page.locator('main')).not.toContainText('Social cuts')
  await shot(page, '40-demos')

  // the meeting: outcomes, not a script
  await page.getByTestId('demos-prepare').click()
  await expect(page).toHaveURL(/\/nagarro\/demos\/prepare/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Prepare a client meeting')
  await expect(page.locator('main')).not.toContainText('What you say')
  await expect(page.locator('.outcome')).toHaveCount(4)
  await expect(page.getByTestId('outcome-2')).not.toHaveClass(/is-done/)

  // build my own demo from plain words, edit it, save it: the demo outcome is ticked
  await page.getByTestId('prep-build-demo').click()
  await page.getByTestId('demo-ask').fill('Figma and code drift apart')
  await page.getByTestId('demo-ask').press('Enter')
  const playlist = page.getByTestId('playlist').locator('.playlist__title')
  await expect(playlist).toHaveText(['The challenge', 'One inconsistency', 'Reviewed in code and Figma'])
  await page.getByTestId('playlist-toggle-challenge').uncheck()
  await page.getByTestId('playlist-toggle-impact').check()
  await expect(playlist).toHaveText(['One inconsistency', 'Why it matters', 'Reviewed in code and Figma'])
  await page.getByPlaceholder(/Name it/).fill('Drift walkthrough')
  await page.getByTestId('save-playlist').click()
  await expect(page.getByTestId('outcome-2')).toHaveClass(/is-done/)
  await expect(page.getByTestId('outcome-2')).toContainText('Drift walkthrough')
  await shot(page, '41-prepare-meeting')

  // present: the guide bar and the notes window walk the saved demo
  const notes = await context.newPage()
  await notes.goto('/presenter/demo-brand')
  await page.getByTestId('prep-present').click()
  await expect(page).toHaveURL(/\/client\/demo-brand/)
  await expect(page.locator('.demobar__pip')).toHaveCount(3)
  await page.getByTestId('demo-chapters').click()
  await expect(page.locator('.ws-switch__label')).toContainText('This meeting’s demo · 3 chapters')
  await expect(page.getByTestId('demo-chapter-ai')).toContainText('Not in this demo')
  await page.keyboard.press('Escape')
  await expect(notes.locator('.notes-window__chapter:not(.is-optional)')).toHaveCount(3)

  // the client demo overview offers the demos instead of the chapter list
  await page.goto('/client/demo-brand?guide=off')
  await expect(page.locator('.story-dark .process')).toHaveCount(0)
  await expect(page.getByTestId('pick-fix-travels')).toBeVisible()

  expect(errors).toEqual([])
})
