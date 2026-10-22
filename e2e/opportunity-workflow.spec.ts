// Northwind, end to end in Edge: context → requirements → evidence → template draft → edits kept on
// redraft → exports → publish → client Proposal summary → deck on Carolina's engine → outdated flag.
import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { shot } from './shots'

const OPP = '/nagarro/clients/northwind/opportunities/opp-northwind-rfp'
const main = (page: Page) => page.locator('main')

async function download(page: Page, click: () => Promise<void>) {
  const [d] = await Promise.all([page.waitForEvent('download'), click()])
  const path = await d.path()
  return { name: d.suggestedFilename(), text: readFileSync(path!, 'utf8') }
}

test('Northwind RFP: from request to published summary and deck', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto('/nagarro')
  await expect(page.getByRole('heading', { name: 'Nagarro design systems hub' })).toBeVisible()
  await shot(page, '01-home')

  // 3 · context
  await page.goto(`${OPP}/context`)
  await page.getByTestId('confirm-context').click()
  await main(page).getByRole('button', { name: 'Continue', exact: true }).click()

  // 4 · requirements: analyse, edit one, restore it
  await expect(page).toHaveURL(/\/requirements$/)
  await page.getByTestId('analyze-request').click()
  await expect(main(page).getByText('15 requirements')).toBeVisible()
  await expect(main(page).getByText('Not from documents · Pricing')).toBeVisible()
  const first = main(page).locator('[data-testid^="req-text-"]').first()
  const original = await first.inputValue()
  await first.fill('Describe how you would assess our design system for AI tools.')
  await first.blur()
  const reqId = (await first.getAttribute('data-testid'))!.replace('req-text-', '')
  await page.getByTestId(`restore-${reqId}`).click()
  await expect(first).toHaveValue(original)
  await shot(page, '02-requirements')
  await main(page).getByRole('button', { name: 'Continue', exact: true }).click()

  // 5 · sources: Contoso's questionnaire never appears, its approved reusable note does
  await page.getByTestId('find-evidence').click()
  await expect(main(page).getByText('Recommended for this request')).toBeVisible()
  await expect(main(page).getByText('Design Systems offer deck').first()).toBeVisible()
  await expect(main(page).getByText('Three brands on one foundation (reusable note, sample)').first()).toBeVisible()
  await expect(main(page).getByText('Contoso Bank: vendor questionnaire (sample)')).toHaveCount(0)
  await shot(page, '03-sources')
  await main(page).getByRole('button', { name: 'Continue to the draft' }).click()

  // 6 · draft: template label, open questions, conflict, evidence; an edit survives a redraft
  await page.getByTestId('draft-template').click()
  await expect(main(page).getByText('Template draft (no model)').first()).toBeVisible()
  await expect(page.getByTestId('conflicts')).toContainText('Package names')
  await expect(page.getByTestId('approach-card')).toContainText('2-week AI audit')
  await expect(page.getByTestId('coverage-summary')).toContainText('open or gap')
  const section = main(page).locator('article[data-testid^="draft-"]').nth(1)
  await section.locator('[data-testid^="edit-"]').click()
  const edited = 'Edited by the bid team: we start with a two-week read of Figma and code.'
  await section.locator('[data-testid^="body-"]').fill(edited)
  await page.getByTestId('draft-template').click()
  await page.getByTestId('regenerate-confirm').click()
  await expect(main(page).getByText('v2 ·').first()).toBeVisible()
  await expect(main(page).locator('article[data-testid^="draft-"]').nth(1)).toContainText(edited)
  await expect(main(page).locator('article[data-testid^="draft-"]').nth(1)).toContainText('kept from v1')
  await shot(page, '04-response', true)
  await main(page).getByRole('button', { name: 'Continue to export' }).click()

  // 7 · exports and publish
  const md = await download(page, () => main(page).getByRole('button', { name: /Response \(markdown/ }).click())
  expect(md.name).toMatch(/\.md$/)
  expect(md.text).toContain('Northwind Retail')
  const csv = await download(page, () => main(page).getByRole('button', { name: 'Requirements matrix (CSV)' }).click())
  expect(csv.name).toMatch(/\.csv$/)
  const packet = await download(page, () => page.getByTestId('export-packet').click())
  expect(packet.text).toMatch(/reference material/i)
  expect(packet.text).not.toContain('CONTOSO-ISOLATION-MARKER')

  await page.getByTestId('publish-open').click()
  await expect(page.getByRole('dialog')).toContainText('still quotes internal-only material')
  await page.getByTestId('publish-confirm').click()
  await expect(main(page).getByText('Shared · summary of response v2')).toBeVisible()
  await shot(page, '05-export')

  // publish Northwind v1 so the client workspace can open, then read the summary as the client (presenter)
  await page.goto('/nagarro/clients/northwind')
  await main(page).getByRole('button', { name: 'Publish v1' }).click()
  await expect(main(page).getByRole('button', { name: 'Publish v2' })).toBeVisible()
  await page.goto(`${OPP}/export`)
  await page.getByTestId('see-as-client').click()
  await expect(page).toHaveURL(/\/client\/northwind\/evidence\/proposal$/)
  const summary = page.getByTestId('client-published-summary')
  await expect(summary).toContainText('Our understanding')
  await expect(summary).toContainText(edited)
  for (const internal of ['Battle card', 'Case studies', 'practice documents', 'Pricing is not part']) await expect(summary).not.toContainText(internal)
  await shot(page, '06-client-proposal-summary', true)

  // deck on Carolina's engine
  await page.goto(`${OPP}/export`)
  await page.getByTestId('prepare-presentation').click()
  await page.getByTestId('build-deck').click()
  await page.getByTestId('approve-plan').click()
  const frame = page.frameLocator('[data-testid="slides-frame"]')
  await expect(frame.locator('section')).toHaveCount(13)
  await expect(frame.locator('body')).toContainText('Prepared for Northwind Retail')
  await shot(page, '07-deck-slides')
  await main(page).getByRole('tab', { name: 'Hand off' }).or(main(page).getByRole('button', { name: 'Hand off', exact: true })).first().click()
  const deckJson = await download(page, () => page.getByTestId('export-deck-json').click())
  expect(JSON.parse(deckJson.text).slides).toHaveLength(13)
  const html = await download(page, () => page.getByTestId('export-deck-html').click())
  expect(html.text).toContain('NagarroSlides')
  const deckUrl = page.url()

  await page.getByTestId('present-deck').click()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.present-bar')).toContainText('2 / 13')
  await shot(page, '08-present')
  await page.keyboard.press('Escape')

  // a source changes approval → the deck says it is outdated and offers a rebuild
  await page.goto('/nagarro/knowledge/src-offer-deck')
  await main(page).getByRole('button', { name: 'Mark outdated' }).click()
  await page.goto(deckUrl)
  await expect(page.getByTestId('rebuild-deck')).toBeVisible()
  await shot(page, '09-deck-outdated')

  expect(errors.filter((e) => !/favicon|ResizeObserver/.test(e))).toEqual([])
})
