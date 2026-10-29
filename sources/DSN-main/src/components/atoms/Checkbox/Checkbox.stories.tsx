import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';
import spec from './Checkbox.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Checkbox> = {
  title: 'Inputs & Controls/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    showTrailingIcon: false,
  },
  argTypes: {
    size: { control: 'select', options: ['md', 'sm'] },
    fullWidth: { control: 'boolean' },
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showAvatar: { control: 'boolean' },
    showLeadingIcon: { control: 'boolean' },
    showDescription: { control: 'boolean' },
    showDescriptionRight: { control: 'boolean' },
    showBadge: { control: 'boolean' },
    showTag: { control: 'boolean' },
    showTrailingIcon: { control: 'boolean' },
    showButtons: { control: 'boolean' },
    showSwitcherRight: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Playground: Story = {
  args: {
    label: 'Label',
    size: 'md',
    checked: false,
  },
};

export const Selected: Story = {
  args: {
    label: 'Label',
    size: 'md',
    checked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Label',
    size: 'md',
    indeterminate: true,
  },
};

export const Small: Story = {
  args: {
    label: 'Label',
    size: 'sm',
    checked: true,
  },
};

export const RichContent: Story = {
  render: (args) => (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <Checkbox {...args} fullWidth />
    </div>
  ),
  args: {
    label: 'Label',
    description: 'Description',
    descriptionRight: 'Assist label',
    showDescription: true,
    showDescriptionRight: true,
    showAvatar: true,
    showLeadingIcon: true,
    showBadge: true,
    showTag: true,
    showButtons: true,
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    checked: true,
    disabled: true,
  },
};

export const IndicatorOnly: Story = {
  args: {
    checked: false,
    showContent: false,
    'aria-label': 'Select row',
  },
};

export const FullWidth: Story = {
  render: (args) => (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <Checkbox {...args} fullWidth label="Choice list item (full width)" />
    </div>
  ),
  args: {
    checked: false,
  },
};

export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        label="Receive weekly summary"
        checked={checked}
        onCheckedChange={setChecked}
        showTrailingIcon={false}
      />
    );
  },
};
