// The knowledge library in Edge: filters, a link-only source, a Markdown upload that is read,
// plugin JSON import and an unsupported format that is refused with a reason.
import { expect, test } from '@playwright/test'
import { shot } from './shots'

test('knowledge library: browse, add, upload and refuse', async ({ page }) => {
  await page.goto('/nagarro/knowledge')
  await expect(page.getByRole('heading', { name: 'Knowledge library' })).toBeVisible()
  await expect(page.locator('main')).toContainText('Design Systems offer deck')
  await page.goto('/nagarro/knowledge?tab=client')
  await expect(page.locator('main')).toContainText('Contoso Bank: vendor questionnaire (sample)')
  await shot(page, '10-knowledge-library')

  // link only
  await page.goto('/nagarro/knowledge/add')
  await page.getByRole('radio', { name: 'Link only' }).or(page.getByRole('button', { name: 'Link only' })).first().click()
  await page.getByTestId('source-title').fill('Polaris governance article')
  await page.getByTestId('source-url').fill('https://polaris.shopify.com/contributing')
  await page.getByTestId('add-link').click()
  await expect(page.locator('main')).toContainText('Polaris governance article')

  // markdown upload is read into sections
  await page.goto('/nagarro/knowledge/add')
  await page.getByTestId('source-title').fill('Governance playbook (test upload)')
  await page.getByTestId('file-input').setInputFiles({ name: 'playbook.md', mimeType: 'text/markdown', buffer: Buffer.from('# Governance playbook\n\n## Who approves token changes\n\nThe system owner approves changes to semantic tokens. AI-proposed changes follow the same review.\n') })
  await expect(page.locator('main')).toContainText('Who approves token changes')
  await shot(page, '11-knowledge-upload')

  // plugin JSON (figma-text@1) is accepted like any other upload
  await page.goto('/nagarro/knowledge/add')
  await page.getByTestId('source-title').fill('Plugin export (test)')
  const capture = { schema: 'figma-text@1', fileKey: 'abcdefghij12', fileName: 'Test deck', page: { id: '0:1', name: 'Slides' }, capturedAt: '2026-10-22T10:00:00Z', capturedBy: 'figma-plugin', frames: [{ nodeId: '1:2', name: 'Governance', texts: [{ text: 'Who decides', fontSize: 48 }, { text: 'A named owner approves every change to shared components.', fontSize: 20 }] }] }
  await page.getByTestId('file-input').setInputFiles({ name: 'capture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(capture)) })
  await expect(page.locator('main')).toContainText('A named owner approves every change')

  // .pptx is refused with a reason
  await page.goto('/nagarro/knowledge/add')
  await page.getByTestId('source-title').fill('Old deck (pptx)')
  await page.getByTestId('file-input').setInputFiles({ name: 'old.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer: Buffer.from('PK\u0003\u0004') })
  await expect(page.locator('body')).toContainText('Slides files are not read')
})
