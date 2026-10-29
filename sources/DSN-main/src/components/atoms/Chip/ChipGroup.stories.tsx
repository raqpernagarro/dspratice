import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip, ChipGroup, type ChipSize } from './Chip';
import spec from './Chip.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const FILTERS = ['All', 'Active', 'Pending', 'Blocked', 'Resolved'] as const;
const TECH = ['TypeScript', 'React', 'CSS', 'Accessibility', 'Testing'] as const;

type ChipGroupStoryProps = ComponentProps<typeof ChipGroup> & { size: ChipSize };

const meta: Meta<ChipGroupStoryProps> = {
  title: 'Inputs & Controls/Chip Group',
  component: ChipGroup,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    label: 'Filter by status',
    size: 'md',
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
      description: 'Size of every chip in the group. Never mix sizes.',
      table: { defaultValue: { summary: 'md' } },
    },
    label: {
      control: 'text',
      description: 'Accessible name for the group.',
    },
    children: { table: { disable: true } },
    className: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<ChipGroupStoryProps>;

export const Playground: Story = {
  render: (args) => (
    <ChipGroup label={args.label}>
      {FILTERS.map((label) => (
        <Chip
          key={label}
          label={label}
          size={args.size}
          selected={label === 'Active'}
          showLeadingIcon={false}
          showTrailingIcon={false}
        />
      ))}
    </ChipGroup>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {(['sm', 'md'] as const).map((size) => (
        <ChipGroup key={size} label={`${args.label} (${size})`}>
          {FILTERS.slice(0, 4).map((label) => (
            <Chip
              key={label}
              label={label}
              size={size}
              selected={label === 'Active'}
              showLeadingIcon={false}
              showTrailingIcon={false}
            />
          ))}
        </ChipGroup>
      ))}
    </div>
  ),
};

export const FilterBar: Story = {
  render: (args) => {
    const [active, setActive] = useState<(typeof FILTERS)[number]>('All');
    return (
      <ChipGroup label={args.label}>
        {FILTERS.map((label) => (
          <Chip
            key={label}
            label={label}
            size={args.size}
            selected={active === label}
            onClick={() => setActive(label)}
            showLeadingIcon={false}
            showTrailingIcon={false}
          />
        ))}
      </ChipGroup>
    );
  },
};

export const MultiSelect: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<Set<string>>(new Set(['TypeScript', 'React']));
    function toggle(label: string) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        return next;
      });
    }
    return (
      <ChipGroup label="Select technologies">
        {TECH.map((label) => (
          <Chip
            key={label}
            label={label}
            size={args.size}
            selected={selected.has(label)}
            onClick={() => toggle(label)}
            showLeadingIcon={false}
            showTrailingIcon={false}
          />
        ))}
      </ChipGroup>
    );
  },
};

export const Dismissible: Story = {
  render: (args) => {
    const [values, setValues] = useState([...TECH.slice(0, 4)]);
    return (
      <ChipGroup label="Selected technologies">
        {values.map((label) => (
          <Chip
            key={label}
            label={label}
            size={args.size}
            selected
            onDismiss={() => setValues((prev) => prev.filter((x) => x !== label))}
            showLeadingIcon={false}
            showTrailingIcon={false}
          />
        ))}
      </ChipGroup>
    );
  },
};
