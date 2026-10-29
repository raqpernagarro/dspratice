// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=9180-10128
// source=src/components/molecules/PromptInput/PromptInput.tsx
// component=PromptInput
import figma from 'figma'

export default {
  example: figma.code`<PromptInput
  placeholder="Ask anything"
  onSubmit={handleSubmit}
/>`,
  imports: [
    "import { PromptInput } from 'ds-ngr'",
  ],
  id: 'prompt-input',
  metadata: { nestable: true, props: {} },
}
