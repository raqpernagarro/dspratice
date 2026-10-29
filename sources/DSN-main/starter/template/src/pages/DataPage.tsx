import { useMemo, useState } from 'react';
import { Button, DataTable, SearchBar, SectionHeader, Tag, Toolbar } from 'ds-ngr';
import type { DataTableColumnDef, DataTableRow, TagVariant } from 'ds-ngr';
import { Layout } from '../Layout';

// Tag variant follows meaning — see "Tag semantic mapping" in node_modules/ds-ngr/AI.md.
const STATUS_VARIANT: Record<string, TagVariant> = {
  'On track': 'success',
  'At risk': 'warning',
  Blocked: 'error',
  Draft: 'neutral',
};

const columns: DataTableColumnDef[] = [
  { id: 'select', header: '', fieldType: 'checkbox', headerVariant: 'checkbox', widthMode: 'fixed', width: 40, frozen: true, reorderable: false, sortable: false, align: 'center' },
  { id: 'name', header: 'Project', fieldType: 'string', widthMode: 'stretch', minWidth: 200, sortable: true },
  {
    id: 'status',
    header: 'Status',
    fieldType: 'tag',
    widthMode: 'fixed',
    width: 140,
    sortable: true,
    render: (value) => <Tag label={String(value)} variant={STATUS_VARIANT[String(value)] ?? 'neutral'} size="sm" />,
  },
  { id: 'owner', header: 'Owner', fieldType: 'string', widthMode: 'fixed', width: 180, sortable: true },
  { id: 'budget', header: 'Budget (k€)', fieldType: 'number', widthMode: 'fixed', width: 140, sortable: true, align: 'right' },
];

const allRows: DataTableRow[] = [
  { id: 'p1', cells: { name: 'Customer portal', status: 'On track', owner: 'Ana Costa', budget: 120 } },
  { id: 'p2', cells: { name: 'Billing migration', status: 'At risk', owner: 'Liam Becker', budget: 85 } },
  { id: 'p3', cells: { name: 'Mobile onboarding', status: 'Blocked', owner: 'Priya Nair', budget: 64 } },
  { id: 'p4', cells: { name: 'Analytics revamp', status: 'On track', owner: 'Tom Okafor', budget: 210 } },
  { id: 'p5', cells: { name: 'Partner API', status: 'Draft', owner: 'Mia Lindqvist', budget: 40 } },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const rows = useMemo(
    () => allRows.filter((r) => String(r.cells.name).toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  return (
    <Layout title="Projects" actions={<Button variant="primary" size="md">New project</Button>}>
      <SectionHeader title="Projects" size="large" />
      <Toolbar
        variant="filter-bar"
        leftActions={
          <SearchBar
            variant="ghost"
            placeholder="Search projects"
            aria-label="Search projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
          />
        }
      />
      {/* DataTable is never wrapped in a Card — always full width. */}
      <DataTable columns={columns} rows={rows} selectedRowIds={selected} onSelectedRowIdsChange={setSelected} aria-label="Projects" />
    </Layout>
  );
}
