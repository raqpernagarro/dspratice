// Both set-up journeys in Edge: opening a later step ticks nothing and never makes the client demo
// look out of date; finishing a step ticks it; the project Overview resumes at the right place.
import { expect, test } from '@playwright/test'
import { shot } from './shots'

test('start a new design system: real progress and resume', async ({ page }) => {
  await page.goto('/nagarro/start?journey=new')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Start a new design system')
  await page.getByTestId('start-fabrikam').click()
  await expect(page).toHaveURL(/\/nagarro\/clients\/fabrikam\/journey\/new\/1$/)
  await expect(page.locator('.version-pill')).toContainText('up to date')

  // open step 3 directly: steps 1 and 2 are not ticked, and the demo version is still current
  await page.goto('/nagarro/clients/fabrikam/journey/new/3')
  await expect(page.locator('.wizard__steps .step.is-done')).toHaveCount(0)
  await expect(page.locator('.version-pill')).toContainText('up to date')

  // finishing step 1 ticks it
  await page.goto('/nagarro/clients/fabrikam/journey/new/1')
  await page.getByTestId('wizard-continue').click()
  await expect(page).toHaveURL(/\/journey\/new\/2$/)
  await expect(page.locator('.wizard__steps .step.is-done')).toHaveCount(1)
  await shot(page, '22-journey-new')

  // the Overview resumes at step 2
  await page.goto('/nagarro/clients/fabrikam')
  await expect(page.getByTestId('resume-new')).toContainText('Resume: brands')
  await page.getByTestId('resume-new').click()
  await expect(page).toHaveURL(/\/journey\/new\/2$/)
})

test('improve an existing system: linear steps, real completion, resume', async ({ page }) => {
  // a new project, created where the journey starts
  await page.goto('/nagarro/start?journey=improve')
  await page.getByTestId('start-new-project').click()
  await page.getByTestId('project-name').fill('Acme Retail')
  await page.getByTestId('create-project').click()
  await expect(page).toHaveURL(/\/nagarro\/clients\/acme-retail\/journey\/improve\/goals$/)

  // old numeric links still work, and opening a later step ticks nothing
  await page.goto('/nagarro/clients/acme-retail/journey/improve/4')
  await expect(page).toHaveURL(/\/journey\/improve\/assess$/)
  await expect(page.locator('.journey-head .process__card.is-done')).toHaveCount(0)

  await page.goto('/nagarro/clients/acme-retail/journey/improve/goals')
  await expect(page.getByTestId('goals-continue')).toBeDisabled()
  await page.getByRole('button', { name: /AI tools build on the system/ }).click()
  await page.getByTestId('goals-continue').click()
  await expect(page).toHaveURL(/\/journey\/improve\/connect$/)
  await page.getByRole('button', { name: /Connect read-only/ }).click()
  await page.getByRole('button', { name: 'Run the assessment' }).first().click()
  await expect(page).toHaveURL(/\/journey\/improve\/assess$/)
  await page.locator('main').getByRole('button', { name: 'Run the assessment' }).click()
  await expect(page.getByRole('button', { name: 'Review the findings' })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Review the findings' }).click()
  await expect(page).toHaveURL(/\/journey\/improve\/findings$/)
  await expect(page.locator('.journey-head .process__card.is-done')).toHaveCount(3)
  await shot(page, '23-journey-improve')

  await page.goto('/nagarro/clients/acme-retail')
  await expect(page.getByTestId('resume-improve')).toContainText('Resume: review findings')
  await expect(page.locator('main')).toContainText('3 of 8 steps done')
})
