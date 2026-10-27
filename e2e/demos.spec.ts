// Demos in Edge: the stage lists ready-made demos and social cuts; "Build a demo" turns plain words
// into a playlist that the guide bar and the notes window both follow; a playlist can be saved for
// a project; a social cut plays on the real client demo; the client demo overview offers the demos.
import { expect, test } from '@playwright/test'
import { shot } from './shots'

test('demos: build a playlist, present it with notes, save it, play a social cut', async ({ page, context }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/nagarro/demos')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Show it working.')
  for (const id of ['ai-on-system', 'retheme', 'fix-travels', 'scorecard', 'meeting-story', 'full-story']) await expect(page.getByTestId(`mini-${id}`)).toBeVisible()
  await expect(page.getByTestId('social-cuts').locator('li')).toHaveCount(5)
  await shot(page, '40-demos')

  // plain words → a playlist, edited by hand
  await page.getByTestId('demo-ask').fill('Figma and code drift apart')
  await page.getByTestId('demo-ask').press('Enter')
  const playlist = page.getByTestId('playlist').locator('.playlist__title')
  await expect(playlist).toHaveText(['The challenge', 'One inconsistency', 'Reviewed in code and Figma'])
  await page.getByTestId('playlist-toggle-challenge').uncheck()
  await page.getByTestId('playlist-toggle-impact').check()
  await expect(playlist).toHaveText(['One inconsistency', 'Why it matters', 'Reviewed in code and Figma'])
  await shot(page, '41-demos-playlist')

  // saved for Demo Brand
  await page.getByPlaceholder(/Name it/).fill('Drift walkthrough')
  await page.getByTestId('save-playlist').click()
  await expect(page.getByTestId('saved-playlists')).toContainText('Drift walkthrough')

  // the notes window follows the playlist
  const notes = await context.newPage()
  await notes.goto('/presenter/demo-brand')
  await page.getByTestId('present-playlist').click()
  await expect(page).toHaveURL(/\/client\/demo-brand/)
  await expect(page.locator('.demobar__pip')).toHaveCount(3)
  await page.getByTestId('demo-chapters').click()
  await expect(page.locator('.ws-switch__label')).toContainText('This meeting’s demo · 3 chapters')
  await expect(page.getByTestId('demo-chapter-inconsistency')).toBeVisible()
  await expect(page.getByTestId('demo-chapter-ai')).toContainText('Not in this demo')
  await page.keyboard.press('Escape')
  await expect(notes.locator('.notes-window__chapter:not(.is-optional)')).toHaveCount(3)
  await expect(notes.locator('.notes-window__chapter').first()).toContainText('One inconsistency')

  // a social cut plays on the real client demo, to its last card
  await page.goto('/nagarro/demos/cut/ai-readiness-in-60-seconds')
  await page.getByTestId('cut-play').click()
  await expect(page.locator('.cut__caption')).toContainText('Is your design system ready for AI tools?', { timeout: 20_000 })
  await expect(page.locator('.cut')).toHaveAttribute('data-cut-state', 'done', { timeout: 40_000 })
  await shot(page, '42-social-cut')

  // the client demo overview offers the demos instead of the chapter list
  await page.goto('/client/demo-brand')
  await expect(page.locator('.story-dark .process')).toHaveCount(0)
  await expect(page.locator('main')).not.toContainText('An example system')
  await expect(page.getByTestId('pick-fix-travels')).toBeVisible()

  expect(errors).toEqual([])
})
