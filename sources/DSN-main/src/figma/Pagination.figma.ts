// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=609-16611
// source=src/components/atoms/Pagination/Pagination.tsx
// component=Pagination
import figma from 'figma'

export default {
  example: figma.code`<Pagination
  page={page}
  totalPages={13}
  totalRecords={1240}
  onPageChange={setPage}
/>`,
  imports: [
    "import { Pagination } from 'ds-ngr'",
  ],
  id: 'pagination',
  metadata: { nestable: true, props: {} },
}
