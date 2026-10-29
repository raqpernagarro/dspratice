// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8984-80601
// source=src/components/molecules/BulkActionBar/BulkActionBar.tsx
// component=BulkActionBar
import figma from 'figma'

export default {
  example: figma.code`<BulkActionBar
  selectedCount={selected.length}
  actions={actions}
  onDismiss={clearSelection}
/>`,
  imports: [
    "import { BulkActionBar } from 'ds-ngr'",
  ],
  id: 'bulk-action-bar-alt',
  metadata: { nestable: true, props: {} },
}
