// Both set-up journeys in Edge: a new system is set up in the DS Starter Pack and recorded from its
// project file; the basics by hand and the improve steps tick only on work done, never make the
// client demo look out of date, and the project Overview resumes at the right place.
import { expect, test } from '@playwright/test'
import { shot } from './shots'

test('start a new design system: the Starter Pack set-up, recorded in the project', async ({ page }) => {
  await page.goto('/nagarro/start?journey=new')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Start a new design system')
  await page.getByTestId('start-fabrikam').click()
  await expect(page).toHaveURL(/\/nagarro\/clients\/fabrikam\/journey\/new$/)
  await expect(page.locator('.version-pill')).toContainText('up to date')
  // the real wizard sits in the page (framed when it runs, the commands to start it when not)
  await expect(page.getByTestId('xframe-starter-setup')).toBeVisible()
  await shot(page, '22-journey-new')

  // record a set-up from the Starter Pack's own project file: the hub says what it keeps and leaves
  await page.getByTestId('starter-project-file').setInputFiles('e2e/fixtures/acme.dsproject.json')
  const preview = page.getByTestId('starter-preview')
  await expect(preview).toContainText('Acme Insights')
  await expect(preview).toContainText('The hub keeps')
  await expect(preview).toContainText('Stays in the Starter Pack')
  await page.getByTestId('record-starter-project').click()
  await expect(page.getByText(/Recorded from/)).toBeVisible()

  await page.goto('/nagarro/clients/fabrikam')
  await expect(page.getByTestId('resume-new')).toContainText('Review the set-up')
})

test('the basics by hand: ticked on work done, resumed from the Overview', async ({ page }) => {
  await page.goto('/nagarro/clients/fabrikam/journey/new')
  await page.getByTestId('other-ways').locator('summary').click()
  await page.getByTestId('other-ways').getByTestId('basics-by-hand').click()
  await expect(page).toHaveURL(/\/journey\/new\/1$/)

  // open step 3 directly: nothing is ticked, and the demo version is still current
  await page.goto('/nagarro/clients/fabrikam/journey/new/3')
  await expect(page.locator('.wizard__steps .step.is-done')).toHaveCount(0)
  await expect(page.locator('.version-pill')).toContainText('up to date')

  // finishing step 1 ticks it, and the Overview resumes at step 2
  await page.goto('/nagarro/clients/fabrikam/journey/new/1')
  await page.getByTestId('wizard-continue').click()
  await expect(page).toHaveURL(/\/journey\/new\/2$/)
  await expect(page.locator('.wizard__steps .step.is-done')).toHaveCount(1)
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
