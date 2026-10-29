import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pencil } from 'lucide-react';
import { MenuCell } from './MenuCell';
import spec from './MenuCell.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof MenuCell> = {
  title: 'Navigation/Menu Cell',
  component: MenuCell,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div role="menu" aria-label="Menu preview">
        <Story />
      </div>
    ),
  ],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'switcher'] },
    destructive: { control: 'boolean' },
    disabled: { control: 'boolean' },
    selected: { control: 'boolean' },
    showLabel: { control: 'boolean' },
    showDescription: { control: 'boolean' },
    showDescriptionRight: { control: 'boolean' },
    showLeadingIcon: { control: 'boolean' },
    showTrailingIcon: { control: 'boolean' },
    showAvatar: { control: 'boolean' },
    shortcut: { control: 'boolean' },
    showBadge: { control: 'boolean' },
    showTag: { control: 'boolean' },
    showButtons: { control: 'boolean' },
    actionIcon: { control: false },
  },
  args: {
    showTrailingIcon: false,
  },
};

export default meta;
type Story = StoryObj<typeof MenuCell>;

export const Playground: Story = {
  args: {
    label: 'Label',
  },
};

export const Selected: Story = {
  args: {
    label: 'Label',
    selected: true,
  },
};

export const HoverReadyLayout: Story = {
  name: 'Rich content',
  render: (args) => (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <MenuCell
        {...args}
        className={`dsn-menu-cell--full-width${args.className ? ` ${args.className}` : ''}`}
      />
    </div>
  ),
  args: {
    label: 'Label',
    description: 'Description',
    descriptionRight: 'Description',
    showDescription: true,
    showDescriptionRight: true,
    showAvatar: true,
    showTag: true,
    showBadge: true,
    shortcut: true,
    showButtons: true,
  },
};

export const SwitcherVariant: Story = {
  args: {
    variant: 'switcher',
    label: 'Label',
    selected: true,
    switcherChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    disabled: true,
    showAvatar: true,
    showTag: true,
    shortcut: true,
  },
  parameters: {
    // Intentional static disabled preview; keyboard interaction is covered by active stories/tests.
    a11y: { disable: true },
  },
};

export const Destructive: Story = {
  args: {
    label: 'Delete file',
    destructive: true,
    showLeadingIcon: true,
  },
};

export const WithActionButton: Story = {
  name: 'With action button',
  args: {
    label: 'Quarterly report',
    showLeadingIcon: false,
    showButtons: true,
    actionIcon: <Pencil size={16} aria-hidden="true" />,
    actionAriaLabel: 'Rename Quarterly report',
  },
};
