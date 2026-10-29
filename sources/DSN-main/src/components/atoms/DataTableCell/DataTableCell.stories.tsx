import type { Meta, StoryObj } from '@storybook/react-vite';
import { Diamond, Star } from 'lucide-react';
import { expect, fn, userEvent } from 'storybook/test';
import type { DataTableFieldType } from '../../../types/common';
import { DataTableCell } from './DataTableCell';
import spec from './DataTableCell.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const FIELD_TYPES: DataTableFieldType[] = [
  'main',
  'string',
  'text',
  'long-text',
  'single-user',
  'multi-user',
  'tags-readonly',
  'tags-multi',
  'tags-single',
  'boolean',
  'buttons',
  'single-choice',
  'multi-choice',
  'number',
  'checkbox',
  'expand',
  'url-readonly',
  'url',
  'contact',
  'contacts',
  'contacts-list',
  'file',
  'email',
  'phone',
  'range',
  'datetime',
  'month-year',
  'date',
  'address',
  'empty',
  'icon',
];

const person = (name: string) => ({ name, initials: name.split(' ').map((part) => part[0]).join('') });

/** Representative value per field type, mirroring the Figma frame. */
const SAMPLE_VALUES: Record<string, unknown> = {
  main: person('Label'),
  string: 'Label',
  text: 'Label',
  'long-text': 'A longer text value that will be truncated with an ellipsis',
  'single-user': person('Ada Lovelace'),
  'multi-user': [person('Ada Lovelace'), person('Grace Hopper'), person('Alan Turing')],
  'tags-readonly': ['Label', 'Label', 'Label'],
  'tags-multi': [
    { label: 'Label', variant: 'success' },
    { label: 'Label', variant: 'success' },
    { label: 'Label', variant: 'success' },
  ],
  'tags-single': { label: 'Label', variant: 'success' },
  boolean: false,
  buttons: [
    { label: 'Button', icon: Diamond },
    { label: 'Button', icon: Diamond },
  ],
  'single-choice': 'Label',
  'multi-choice': ['Label 1', 'Label 2', 'Label 3', 'Label 4'],
  number: 12345,
  checkbox: false,
  expand: false,
  'url-readonly': 'https://link.com',
  url: 'https://link.com',
  contact: person('Profile Name'),
  contacts: [person('Profile Name'), person('Profile Name'), person('Profile Name')],
  'contacts-list': [person('Profile Name'), person('Profile Name'), person('Profile Name'), person('Profile Name')],
  file: 'doc.pdf',
  email: 'email@email.com',
  phone: '+1 (415) 555-1234',
  range: [123, 123],
  datetime: '11/1/2018 10:45:03 PM',
  'month-year': 'January 2025',
  date: '11/1/2018',
  address: '12345 Broadway Avenue, New York',
  empty: 'Add [field name]',
  icon: Star,
};

const meta: Meta<typeof DataTableCell> = {
  title: 'Data Display/Data Table Cell',
  component: DataTableCell,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
  argTypes: {
    fieldType: {
      control: 'select',
      options: FIELD_TYPES,
    },
    state: {
      control: 'select',
      options: ['default', 'hover'],
    },
  },
  args: {
    onAction: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof DataTableCell>;

export const Playground: Story = {
  args: { fieldType: 'string', value: 'Label' },
};


/** Every field type in Default and Hover state, matching the Figma component set. */
export const FieldTypes: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 220px 220px', gap: 'var(--space-sm)', alignItems: 'start' }}>
      <strong>Field type</strong>
      <strong>Default</strong>
      <strong>Hover</strong>
      {FIELD_TYPES.map((fieldType) => {
        const narrow = fieldType === 'checkbox' || fieldType === 'expand' || fieldType === 'icon';
        return [
          <code key={`${fieldType}-name`}>{fieldType}</code>,
          <DataTableCell
            key={`${fieldType}-default`}
            {...args}
            fieldType={fieldType}
            value={SAMPLE_VALUES[fieldType]}
            width={narrow ? 32 : 220}
          />,
          <DataTableCell
            key={`${fieldType}-hover`}
            {...args}
            fieldType={fieldType}
            value={SAMPLE_VALUES[fieldType]}
            state="hover"
            width={narrow ? 32 : 220}
          />,
        ];
      })}
    </div>
  ),
};

export const TagsMultiCell: Story = {
  args: { fieldType: 'tags-multi', value: SAMPLE_VALUES['tags-multi'], width: 220 },
};

export const ContactsListCell: Story = {
  args: { fieldType: 'contacts-list', value: SAMPLE_VALUES['contacts-list'], state: 'hover', width: 220 },
};

export const ExpandCell: Story = {
  args: { fieldType: 'expand', value: false, width: 32 },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Expand row' }));
    await expect(args.onAction).toHaveBeenCalledWith('expand', false, expect.anything());
  },
};

export const ExampleRevealActions: Story = {
  args: { fieldType: 'email', value: SAMPLE_VALUES.email, revealActionsOnHover: true, width: 260 },
};

export const EmptyCell: Story = {
  args: { fieldType: 'empty', value: 'Add [field name]' },
};

export const LoadingCell: Story = {
  args: { fieldType: 'string', loading: true },
};
