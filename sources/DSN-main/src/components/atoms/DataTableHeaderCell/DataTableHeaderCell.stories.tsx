import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DataTableHeaderCell, type DataTableHeaderCellProps } from './DataTableHeaderCell';
import spec from './DataTableHeaderCell.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof DataTableHeaderCell> = {
  title: 'Data Display/Data Table Header Cell',
  component: DataTableHeaderCell,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  decorators: [
    (Story) => (
      <div role="grid" aria-label="Column header preview" style={{ display: 'contents' }}>
        <div role="row" style={{ display: 'contents' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: { control: 'select', options: ['title', 'checkbox'] },
    state: { control: 'select', options: ['default', 'hover'] },
    sortDirection: { control: 'select', options: ['none', 'asc', 'desc'] },
  },
};

export default meta;
type Story = StoryObj<typeof DataTableHeaderCell>;

function InteractiveTitle(args: DataTableHeaderCellProps) {
  const [sortDirection, setSortDirection] = useState<'none' | 'asc' | 'desc'>(args.sortDirection ?? 'none');

  return (
    <DataTableHeaderCell
      {...args}
      variant="title"
      sortDirection={sortDirection}
      onSortChange={setSortDirection}
      onReorderCommand={() => undefined}
      onResizeCommand={() => undefined}
    />
  );
}

export const Playground: Story = {
  args: {
    variant: 'title',
    label: 'Label',
    sortable: true,
    sortDirection: 'none',
    state: 'default',
    width: 160,
  },
  render: (args) => <InteractiveTitle {...args} />,
};

export const Checkbox: Story = {
  args: {
    variant: 'checkbox',
    state: 'default',
    checkboxChecked: false,
    'aria-label': 'Select all rows',
  },
};

