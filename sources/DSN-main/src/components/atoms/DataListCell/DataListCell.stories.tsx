import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AvatarGroup } from '../Avatar';
import { Combobox, type ComboboxOption } from '../Combobox';
import { Tag } from '../Tag';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import { DataListCell } from './DataListCell';
import spec from './DataListCell.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof DataListCell> = {
  title: 'Data Display/Data List Cell',
  component: DataListCell,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'full' },
  args: {
    alignment: 'inline',
    variant: 'with-title',
    state: 'default',
    title: 'Title',
    description: 'Description',
    showIcon: true,
    showActions: true,
    actionAriaLabel: 'Copy description',
  },
  argTypes: {
    alignment: {
      control: 'radio',
      options: ['inline', 'vertical'],
    },
    variant: {
      control: 'radio',
      options: ['with-title', 'just-icon'],
    },
    state: {
      control: 'radio',
      options: ['default', 'hover'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataListCell>;

export const Playground: Story = {};

export const InlineJustIconDefault: Story = {
  args: {
    variant: 'just-icon',
    title: '',
  },
};

export const VerticalWithTitleDefault: Story = {
  args: {
    alignment: 'vertical',
  },
};

export const CustomIcon: Story = {
  args: {
    icon: <PlaceholderIcon />,
  },
};

export const InteractiveButtonAction: Story = {
  args: {
    title: 'Assignees',
    content: (
      <AvatarGroup
        size="xs"
        maxVisible={4}
        avatars={[
          { name: 'Ana Costa', initials: 'AC' },
          { name: 'Joao Silva', initials: 'JS' },
          { name: 'Maya Clark', initials: 'MC' },
          { name: 'Rui Dias', initials: 'RD' },
          { name: 'Luca Rossi', initials: 'LR' },
        ]}
        aria-label="Assignees"
      />
    ),
    showActions: false,
  },
};

export const InteractiveButtonGroup: Story = {
  args: {
    title: 'Status',
    content: <Tag variant="highlight" label="In progress" showIcon={false} />,
    showActions: false,
  },
};

export const InteractiveTextFieldWithTag: Story = {
  args: {
    title: 'Priority',
    content: <Tag variant="warning" label="High" showIcon={false} />,
    showActions: false,
  },
};

const JOB_TITLE_OPTIONS: ComboboxOption[] = [
  { value: 'product-designer', label: 'Product Designer' },
  { value: 'senior-product-designer', label: 'Senior Product Designer' },
  { value: 'ux-researcher', label: 'UX Researcher' },
  { value: 'design-manager', label: 'Design Manager' },
  { value: 'principal-designer', label: 'Principal Designer' },
  { value: 'product-manager', label: 'Product Manager' },
  { value: 'engineering-manager', label: 'Engineering Manager' },
];

function EditableJobTitleValue() {
  const [value, setValue] = useState('product-designer');
  const [editing, setEditing] = useState(false);

  const selectedLabel =
    JOB_TITLE_OPTIONS.find((option) => option.value === value)?.label ?? 'Product Designer';

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 'var(--space-none)',
          margin: 'var(--space-none)',
          color: 'var(--color-foreground-neutral-secondary)',
          fontFamily: 'var(--font-family-default)',
          fontSize: 'var(--font-size-body-sm)',
          fontWeight: 'var(--font-weight-regular)',
          lineHeight: 'var(--font-line-height-body-md)',
          letterSpacing: 'var(--font-letter-spacing-tight)',
          cursor: 'text',
        }}
        aria-label="Edit job title"
      >
        {selectedLabel}
      </button>
    );
  }

  return (
    <Combobox
      showLabel={false}
      aria-label="Job title editor"
      placeholder="Select job title"
      options={JOB_TITLE_OPTIONS}
      value={value}
      defaultOpen
      onChange={(nextValue) => {
        setValue(nextValue);
        setEditing(false);
      }}
      onOpenChange={(open) => {
        if (!open) {
          setEditing(false);
        }
      }}
      showHelper={false}
    />
  );
}

export const InteractiveJobTitleInlineEdit: Story = {
  args: {
    title: 'Job title',
    content: <EditableJobTitleValue />,
    showActions: false,
  },
};

export const InlineProfileFieldsStack: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
      <DataListCell
        alignment="inline"
        title="Assignees"
        content={
          <AvatarGroup
            size="xs"
            maxVisible={4}
            avatars={[
              { name: 'Ana Costa', initials: 'AC' },
              { name: 'Joao Silva', initials: 'JS' },
              { name: 'Maya Clark', initials: 'MC' },
              { name: 'Rui Dias', initials: 'RD' },
              { name: 'Luca Rossi', initials: 'LR' },
            ]}
            aria-label="Assignees"
          />
        }
        showActions={false}
      />

      <DataListCell
        alignment="inline"
        title="Status"
        content={<Tag variant="highlight" label="In progress" showIcon={false} />}
        showActions={false}
      />

      <DataListCell
        alignment="inline"
        title="Priority"
        content={<Tag variant="warning" label="High" showIcon={false} />}
        showActions={false}
      />

      <DataListCell
        alignment="inline"
        title="Job title"
        content={<EditableJobTitleValue />}
        showActions={false}
      />

      <DataListCell
        alignment="inline"
        title="Department"
        description="Product Design"
        showActions={false}
      />
    </div>
  ),
};
