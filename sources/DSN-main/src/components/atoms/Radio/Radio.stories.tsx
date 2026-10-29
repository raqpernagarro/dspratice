import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from './Radio';
import spec from './Radio.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Radio> = {
  title: 'Inputs & Controls/Radio',
  component: Radio,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    showTrailingIcon: false,
  },
  argTypes: {
    size: { control: 'select', options: ['md', 'sm'] },
    checked: { control: 'boolean' },
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
type Story = StoryObj<typeof Radio>;

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
      <Radio
        {...args}
        className={`dsn-radio--full-width${args.className ? ` ${args.className}` : ''}`}
      />
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
    showTrailingIcon: true,
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
    showTrailingIcon: true,
  },
};

export const IndicatorOnly: Story = {
  args: {
    checked: false,
    showContent: false,
    'aria-label': 'Select option',
  },
};

export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Radio
        label="Weekly summary"
        checked={checked}
        onCheckedChange={setChecked}
      />
    );
  },
};
