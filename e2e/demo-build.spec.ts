// The client-safe demo build in Edge (served from dist-demo on 4302): landing, scorecard result,
// the guided story, no presenter notes, and no way into the hub.
import { expect, test } from '@playwright/test'
import { shot } from './shots'

const DEMO = 'http://localhost:4302'

test('demo build: landing, scorecard, walkthrough, nothing internal', async ({ page }) => {
  await page.goto(DEMO)
  await expect(page).toHaveTitle('AI-ready design systems · Nagarro demo')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AI will build your interfaces anyway.')
  await shot(page, '12-demo-landing')

  await page.goto(`${DEMO}/scorecard`)
  for (let q = 1; q <= 10; q++) await page.getByTestId(`sc-q${q}-${q % 3 === 0 ? 1 : 2}`).click()
  const body = page.locator('body')
  await expect(body).toContainText('10 of 10 answered')
  await expect(body).toContainText(/Level \d of 5/)
  await expect(body).toContainText('2-week AI audit')
  await expect(body).not.toContainText('screen 30')
  await shot(page, '13-demo-scorecard', true)

  await page.goto(`${DEMO}/client/demo-brand?guide=meeting`)
  await expect(page.locator('.demobar__headline')).toContainText('drift apart')
  await expect(page.locator('body')).not.toContainText('Presenter notes')
  await expect(page.locator('body')).not.toContainText('Back to preparation')
  await shot(page, '14-demo-walkthrough')

  for (const internal of ['/nagarro', '/nagarro/knowledge', '/nagarro/opportunities']) {
    await page.goto(`${DEMO}${internal}`)
    await expect(page.locator('body')).not.toContainText('Knowledge library')
    await expect(page.locator('body')).not.toContainText('Opportunities')
  }
})
