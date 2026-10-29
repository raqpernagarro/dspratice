import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Check, Star, X } from 'lucide-react';
import { DataTable, type DataTableProps } from './DataTable';
import type { DataTableColumnDef, DataTableRow } from '../../../types/common';
import spec from './DataTable.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const columns: DataTableColumnDef[] = [
  {
    id: 'select',
    header: '',
    fieldType: 'checkbox',
    headerVariant: 'checkbox',
    widthMode: 'fixed',
    width: 40,
    frozen: true,
    reorderable: false,
    sortable: false,
    align: 'center',
  },
  {
    id: 'name',
    header: 'Name',
    fieldType: 'string',
    widthMode: 'fixed',
    width: 200,
    sortable: true,
    reorderable: true,
  },
  {
    id: 'status',
    header: 'Status',
    fieldType: 'tag',
    widthMode: 'fixed',
    width: 220,
    sortable: true,
    reorderable: true,
  },
  {
    id: 'amount',
    header: 'Amount',
    fieldType: 'number',
    widthMode: 'fixed',
    width: 140,
    sortable: true,
    reorderable: true,
    align: 'right',
  },
  {
    id: 'owner',
    header: 'Owner',
    fieldType: 'string',
    widthMode: 'fixed',
    width: 160,
    sortable: true,
    reorderable: true,
  },
  {
    id: 'notes',
    header: 'Notes',
    fieldType: 'string',
    widthMode: 'fixed',
    width: 200,
    sortable: true,
    reorderable: true,
  },
];

const rows: DataTableRow[] = [
  {
    id: 'row-1',
    cells: { name: 'Label', status: ['Label', 'Label'], amount: 12345, owner: 'Design Ops', notes: 'First row note.' },
  },
  {
    id: 'row-2',
    cells: { name: 'Profile Name', status: ['Label'], amount: 42, owner: 'Platform Team', notes: 'Second row.' },
  },
  {
    id: 'row-3',
    cells: { name: 'Add [field name]', status: [], amount: 0, owner: 'Unassigned', notes: '' },
  },
];

const stickyColumns: DataTableColumnDef[] = [
  {
    id: 'select',
    header: '',
    fieldType: 'checkbox',
    headerVariant: 'checkbox',
    widthMode: 'fixed',
    width: 40,
    frozen: true,
    reorderable: false,
    sortable: false,
    align: 'center',
  },
  {
    id: 'name',
    header: 'Name',
    fieldType: 'string',
    widthMode: 'fixed',
    width: 220,
    sortable: true,
    reorderable: true,
  },
  {
    id: 'status',
    header: 'Status',
    fieldType: 'tag',
    widthMode: 'fixed',
    width: 220,
    sortable: true,
    reorderable: true,
  },
  {
    id: 'amount',
    header: 'Amount',
    fieldType: 'number',
    widthMode: 'fixed',
    width: 160,
    sortable: true,
    reorderable: true,
    align: 'right',
  },
  {
    id: 'owner',
    header: 'Owner',
    fieldType: 'string',
    widthMode: 'fixed',
    width: 200,
    sortable: true,
    reorderable: true,
  },
  {
    id: 'notes',
    header: 'Notes',
    fieldType: 'string',
    widthMode: 'fixed',
    width: 260,
    sortable: true,
    reorderable: true,
  },
];

const stickyRows: DataTableRow[] = [
  {
    id: 'sticky-1',
    cells: {
      name: 'Very long contact name that should truncate in sticky first data column',
      status: ['Label', 'Another label', 'A third label'],
      amount: 12345,
      owner: 'Design Ops',
      notes: 'Long note content to force horizontal scroll and verify sticky column offsets.',
    },
  },
  {
    id: 'sticky-2',
    cells: {
      name: 'Profile Name',
      status: ['Label'],
      amount: 42,
      owner: 'Platform Team',
      notes: 'Second row for sticky behavior verification.',
    },
  },
  {
    id: 'sticky-3',
    cells: {
      name: 'Add [field name]',
      status: [],
      amount: 0,
      owner: 'Unassigned',
      notes: 'Third row with empty-ish values.',
    },
  },
];

const meta: Meta<typeof DataTable> = {
  title: 'Data Display/Data Table',
  component: DataTable,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: { columns, rows, 'aria-label': 'Contacts table' },
  argTypes: {
    columns: { control: false },
    rows: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

/** Column order, row selection and sort are held in state so the table is fully interactive. */
function InteractiveTable(args: DataTableProps) {
  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map((column) => column.id));
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [sortState, setSortState] = useState<{ columnId: string; direction: 'none' | 'asc' | 'desc' } | null>(null);

  return (
    <DataTable
      {...args}
      columnOrder={columnOrder}
      onColumnOrderChange={setColumnOrder}
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={setSelectedRowIds}
      sortState={sortState}
      onSortStateChange={setSortState}
    />
  );
}

export const Playground: Story = {
  render: (args) => <InteractiveTable {...args} />,
};

export const StickyColumnsLongContent: Story = {
  render: () => {
    const [columnOrder, setColumnOrder] = useState<string[]>(stickyColumns.map((column) => column.id));
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
    const [sortState, setSortState] = useState<{ columnId: string; direction: 'none' | 'asc' | 'desc' } | null>(null);

    return (
      <div style={{ maxWidth: 640 }}>
        <DataTable
          columns={stickyColumns}
          rows={stickyRows}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          selectedRowIds={selectedRowIds}
          onSelectedRowIdsChange={setSelectedRowIds}
          sortState={sortState}
          onSortStateChange={setSortState}
          aria-label="Sticky columns long content table"
        />
      </div>
    );
  },
};

const hugColumns: DataTableColumnDef[] = [
  { id: 'name', header: 'Name', fieldType: 'string', widthMode: 'stretch', sortable: true },
  { id: 'owner', header: 'Owner', fieldType: 'string', widthMode: 'hug', sortable: true, reorderable: true },
  { id: 'status', header: 'Status', fieldType: 'string', widthMode: 'hug', reorderable: true },
  { id: 'budget', header: 'Budget', fieldType: 'number', align: 'right', reorderable: true },
];

const hugRows: DataTableRow[] = [
  { id: 'hug-1', cells: { name: 'Website redesign', owner: 'Ana', status: 'Active', budget: 12000 } },
  { id: 'hug-2', cells: { name: 'Mobile onboarding', owner: 'Rui', status: 'Paused', budget: 8500 } },
  { id: 'hug-3', cells: { name: 'Billing migration', owner: 'Platform', status: 'Done', budget: 30250 } },
];

/** `widthMode: 'hug'` columns size to their widest header/cell; the `stretch` column absorbs the rest. */
export const HugAndStretchColumns: Story = {
  render: () => {
    const [columnOrder, setColumnOrder] = useState<string[]>(hugColumns.map((column) => column.id));

    return (
      <DataTable
        columns={hugColumns}
        rows={hugRows}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        aria-label="Hug and stretch columns table"
      />
    );
  },
};

// ─── All field types ─────────────────────────────────────────────────────────

const person = (name: string) => ({
  name,
  initials: name
    .split(' ')
    .map((part) => part[0])
    .join(''),
});

const allTypeColumns: DataTableColumnDef[] = [
  { id: 'select', header: '', fieldType: 'checkbox', headerVariant: 'checkbox', widthMode: 'fixed', width: 40, align: 'center' },
  // The selection checkbox renders inside the first data column, so Main leads and Expand follows.
  { id: 'main', header: 'Main', fieldType: 'main', widthMode: 'fixed', width: 220, frozen: true, reorderable: false },
  { id: 'expand', header: '', fieldType: 'expand', widthMode: 'fixed', width: 40, sortable: false, reorderable: false },
  { id: 'string', header: 'String', fieldType: 'string', widthMode: 'fixed', width: 180 },
  { id: 'text', header: 'Text field', fieldType: 'text', widthMode: 'fixed', width: 200 },
  { id: 'longText', header: 'Long text', fieldType: 'long-text', widthMode: 'fixed', width: 220 },
  { id: 'email', header: 'Email', fieldType: 'email', widthMode: 'fixed', width: 240 },
  { id: 'phone', header: 'Phone number', fieldType: 'phone', widthMode: 'fixed', width: 240 },
  { id: 'address', header: 'Address', fieldType: 'address', widthMode: 'fixed', width: 240 },
  { id: 'number', header: 'Number', fieldType: 'number', widthMode: 'fixed', width: 140, align: 'right' },
  { id: 'range', header: 'Range', fieldType: 'range', widthMode: 'fixed', width: 160 },
  { id: 'date', header: 'Date', fieldType: 'date', widthMode: 'fixed', width: 160 },
  { id: 'datetime', header: 'Date and time', fieldType: 'datetime', widthMode: 'fixed', width: 220 },
  { id: 'monthYear', header: 'Month and year', fieldType: 'month-year', widthMode: 'fixed', width: 180 },
  { id: 'singleChoice', header: 'Single choice', fieldType: 'single-choice', widthMode: 'fixed', width: 180 },
  { id: 'multiChoice', header: 'Multi choice', fieldType: 'multi-choice', widthMode: 'fixed', width: 200 },
  { id: 'tagsSingle', header: 'Tags single choice', fieldType: 'tags-single', widthMode: 'fixed', width: 180 },
  { id: 'tagsMulti', header: 'Tags multi choice', fieldType: 'tags-multi', widthMode: 'fixed', width: 220 },
  { id: 'tagsReadonly', header: 'Tags read-only', fieldType: 'tags-readonly', widthMode: 'fixed', width: 220 },
  { id: 'singleUser', header: 'Single user or team', fieldType: 'single-user', widthMode: 'fixed', width: 200 },
  { id: 'multiUser', header: 'Multiple users or teams', fieldType: 'multi-user', widthMode: 'fixed', width: 240 },
  { id: 'contact', header: 'Contact', fieldType: 'contact', widthMode: 'fixed', width: 200 },
  { id: 'contacts', header: 'Contacts (table)', fieldType: 'contacts', widthMode: 'fixed', width: 240 },
  { id: 'url', header: 'URL', fieldType: 'url', widthMode: 'fixed', width: 200 },
  { id: 'urlReadonly', header: 'URL read-only', fieldType: 'url-readonly', widthMode: 'fixed', width: 200 },
  { id: 'file', header: 'File', fieldType: 'file', widthMode: 'fixed', width: 180 },
  { id: 'boolean', header: 'Boolean', fieldType: 'boolean', widthMode: 'fixed', width: 120 },
  { id: 'buttons', header: 'Buttons', fieldType: 'buttons', widthMode: 'fixed', width: 220 },
  { id: 'icon', header: 'Icon', fieldType: 'icon', widthMode: 'fixed', width: 72, align: 'center' },
  { id: 'empty', header: 'Empty', fieldType: 'empty', widthMode: 'fixed', width: 180 },
];

const allTypeRows: DataTableRow[] = [
  {
    id: 'all-1',
    cells: {
      main: person('Website redesign'),
      string: 'WEB-1042',
      text: 'Homepage hero refresh',
      longText: 'Rework the hero, navigation and footer to match the new brand guidelines',
      email: 'ana.silva@example.com',
      phone: '+1 (415) 555-1234',
      address: '12345 Broadway Avenue, New York',
      number: 12000,
      range: [10, 25],
      date: '11/1/2026',
      datetime: '11/1/2026 10:45:03 PM',
      monthYear: 'January 2026',
      singleChoice: 'High',
      multiChoice: ['Web', 'Brand', 'Marketing'],
      tagsSingle: { label: 'Active', variant: 'success' },
      tagsMulti: [
        { label: 'Design', variant: 'highlight' },
        { label: 'Frontend', variant: 'success' },
        { label: 'Q4', variant: 'neutral' },
      ],
      tagsReadonly: ['Public', 'Priority'],
      singleUser: person('Ana Silva'),
      multiUser: [person('Ana Silva'), person('Rui Dias'), person('Mia Chen')],
      contact: person('Ana Silva'),
      contacts: [person('Ana Silva'), person('Rui Dias'), person('Mia Chen')],
      url: 'https://example.com/web',
      urlReadonly: 'https://example.com/brief',
      file: 'brief.pdf',
      boolean: true,
      buttons: [{ label: 'Approve', icon: Check }, { label: 'Reject', icon: X }],
      icon: Star,
      empty: 'Add owner',
    },
  },
  {
    id: 'all-2',
    cells: {
      main: person('Mobile onboarding'),
      string: 'MOB-311',
      text: 'Welcome flow',
      longText: 'Shorter text',
      email: 'rui.dias@example.com',
      phone: '+351 912 345 678',
      address: 'Rua Augusta 100, Lisboa',
      number: 8500,
      range: [3, 8],
      date: '3/14/2026',
      datetime: '3/14/2026 09:12:00 AM',
      monthYear: 'March 2026',
      singleChoice: 'Medium',
      multiChoice: ['Mobile'],
      tagsSingle: { label: 'Paused', variant: 'warning' },
      tagsMulti: [{ label: 'iOS', variant: 'highlight' }],
      tagsReadonly: ['Internal'],
      singleUser: person('Rui Dias'),
      multiUser: [person('Rui Dias')],
      contact: person('Rui Dias'),
      contacts: [person('Rui Dias')],
      url: 'https://example.com/mobile',
      urlReadonly: 'https://example.com/spec',
      file: 'flows.fig',
      boolean: false,
      buttons: [{ label: 'Open', icon: Check }],
      icon: Star,
      empty: 'Add owner',
    },
  },
  {
    id: 'all-3',
    cells: {
      main: person('Billing migration'),
      string: 'BIL-007',
      text: 'Stripe v3 cut-over',
      longText: 'Migrate all subscriptions, invoices and customer records with zero downtime',
      email: 'platform@example.com',
      phone: '+44 20 7946 0958',
      address: '221B Baker Street, London',
      number: 30250,
      range: [40, 60],
      date: '7/30/2026',
      datetime: '7/30/2026 06:00:00 PM',
      monthYear: 'July 2026',
      singleChoice: 'Low',
      multiChoice: ['Platform', 'Finance'],
      tagsSingle: { label: 'Blocked', variant: 'error' },
      tagsMulti: [
        { label: 'Backend', variant: 'highlight' },
        { label: 'Risk', variant: 'error' },
      ],
      tagsReadonly: ['Restricted', 'Finance', 'Audit'],
      singleUser: person('Mia Chen'),
      multiUser: [person('Mia Chen'), person('Leo Park')],
      contact: person('Mia Chen'),
      contacts: [person('Mia Chen'), person('Leo Park')],
      url: 'https://example.com/billing',
      urlReadonly: 'https://example.com/runbook',
      file: 'runbook.docx',
      boolean: true,
      buttons: [],
      icon: Star,
      empty: 'Add owner',
    },
  },
  {
    id: 'all-4',
    cells: {
      main: person('Design tokens v2'),
      string: 'DSN-204',
      text: 'Semantic tier rename',
      longText: 'Rename every component token to the new semantic tiers and update Figma variables',
      email: 'mia.chen@example.com',
      phone: '+49 30 901820',
      address: 'Unter den Linden 77, Berlin',
      number: 4200,
      range: [1, 5],
      date: '9/2/2026',
      datetime: '9/2/2026 02:30:00 PM',
      monthYear: 'September 2026',
      singleChoice: 'High',
      multiChoice: ['Design', 'Platform'],
      tagsSingle: { label: 'Active', variant: 'success' },
      tagsMulti: [
        { label: 'Tokens', variant: 'highlight' },
        { label: 'Figma', variant: 'neutral' },
      ],
      tagsReadonly: ['Public'],
      singleUser: person('Mia Chen'),
      multiUser: [person('Mia Chen'), person('Ana Silva')],
      contact: person('Mia Chen'),
      contacts: [person('Mia Chen'), person('Ana Silva')],
      url: 'https://example.com/tokens',
      urlReadonly: 'https://example.com/changelog',
      file: 'tokens.json',
      boolean: true,
      buttons: [{ label: 'Approve', icon: Check }, { label: 'Reject', icon: X }],
      icon: Star,
      empty: 'Add owner',
    },
  },
  {
    id: 'all-5',
    cells: {
      main: person('Support chatbot'),
      string: 'SUP-118',
      text: 'Tier-1 deflection',
      longText: 'Answer common billing and account questions before handing over to an agent',
      email: 'leo.park@example.com',
      phone: '+1 (212) 555-0199',
      address: '350 Fifth Avenue, New York',
      number: 15750,
      range: [20, 35],
      date: '5/18/2026',
      datetime: '5/18/2026 11:05:42 AM',
      monthYear: 'May 2026',
      singleChoice: 'Medium',
      multiChoice: ['Support', 'AI', 'Web'],
      tagsSingle: { label: 'Paused', variant: 'warning' },
      tagsMulti: [
        { label: 'AI', variant: 'highlight' },
        { label: 'Pilot', variant: 'warning' },
      ],
      tagsReadonly: ['Internal', 'Beta'],
      singleUser: person('Leo Park'),
      multiUser: [person('Leo Park'), person('Rui Dias'), person('Mia Chen')],
      contact: person('Leo Park'),
      contacts: [person('Leo Park')],
      url: 'https://example.com/support',
      urlReadonly: 'https://example.com/faq',
      file: 'intents.csv',
      boolean: false,
      buttons: [{ label: 'Open', icon: Check }],
      icon: Star,
      empty: 'Add owner',
    },
  },
  {
    id: 'all-6',
    cells: {
      main: person('Data warehouse'),
      string: 'DAT-560',
      text: 'Nightly ETL',
      longText: 'Consolidate product analytics into a single warehouse with daily snapshots',
      email: 'data@example.com',
      phone: '+33 1 42 68 53 00',
      address: '8 Rue de Rivoli, Paris',
      number: 52000,
      range: [60, 90],
      date: '12/9/2026',
      datetime: '12/9/2026 01:00:00 AM',
      monthYear: 'December 2026',
      singleChoice: 'Low',
      multiChoice: ['Data'],
      tagsSingle: { label: 'Done', variant: 'neutral' },
      tagsMulti: [{ label: 'Analytics', variant: 'success' }],
      tagsReadonly: ['Restricted'],
      singleUser: person('Ana Silva'),
      multiUser: [person('Ana Silva')],
      contact: person('Ana Silva'),
      contacts: [person('Ana Silva'), person('Leo Park')],
      url: 'https://example.com/data',
      urlReadonly: 'https://example.com/schema',
      file: 'schema.sql',
      boolean: true,
      buttons: [],
      icon: Star,
      empty: 'Add owner',
    },
  },
  {
    id: 'all-7',
    cells: {
      main: person('Accessibility audit'),
      string: 'A11Y-033',
      text: 'WCAG 2.2 pass',
      longText: 'Audit every component for contrast, focus order and screen reader labels',
      email: 'a11y@example.com',
      phone: '+34 91 123 4567',
      address: 'Gran Vía 28, Madrid',
      number: 6400,
      range: [5, 12],
      date: '2/21/2026',
      datetime: '2/21/2026 04:15:30 PM',
      monthYear: 'February 2026',
      singleChoice: 'High',
      multiChoice: ['Design', 'Web', 'Mobile', 'QA'],
      tagsSingle: { label: 'Blocked', variant: 'error' },
      tagsMulti: [
        { label: 'WCAG', variant: 'highlight' },
        { label: 'QA', variant: 'neutral' },
        { label: 'Q1', variant: 'neutral' },
      ],
      tagsReadonly: ['Public', 'Compliance'],
      singleUser: person('Rui Dias'),
      multiUser: [person('Rui Dias'), person('Leo Park')],
      contact: person('Rui Dias'),
      contacts: [person('Rui Dias'), person('Mia Chen'), person('Leo Park')],
      url: 'https://example.com/a11y',
      urlReadonly: 'https://example.com/report',
      file: 'audit.pdf',
      boolean: false,
      buttons: [{ label: 'Approve', icon: Check }, { label: 'Reject', icon: X }],
      icon: Star,
      empty: 'Add owner',
    },
  },
];

/**
 * One column per table `fieldType` (every Figma "Field type" except `contacts-list`, which belongs to
 * description-list rows, not tables), with `onCellAction` wired so each
 * cell reveals its hover actions. The expand column toggles per row; the last action is shown below.
 */
export const FieldTypes: Story = {
  parameters: { layout: 'padded' },
  render: () => {
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
    const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
    const [lastAction, setLastAction] = useState('Hover a cell and use its actions');

    const rowsWithExpand = allTypeRows.map((row) => ({
      ...row,
      cells: { ...row.cells, expand: expandedRowIds.includes(row.id) },
    }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <DataTable
          columns={allTypeColumns}
          rows={rowsWithExpand}
          selectedRowIds={selectedRowIds}
          onSelectedRowIdsChange={setSelectedRowIds}
          onCellAction={({ rowId, columnId, action }, event) => {
            if (action === 'expand') {
              setExpandedRowIds((ids) => (ids.includes(rowId) ? ids.filter((id) => id !== rowId) : [...ids, rowId]));
            }
            // Keep the story on-page: skip new tabs / mailto / tel.
            if (action === 'open-external' || action === 'email' || action === 'call') event.preventDefault();
            setLastAction(`${action} → row "${rowId}", column "${columnId}"`);
          }}
          aria-label="All field types table"
        />
        <output aria-live="polite" style={{ color: 'var(--color-foreground-neutral-secondary)', fontSize: 'var(--font-size-label)' }}>
          Last action: {lastAction}
        </output>
      </div>
    );
  },
};
