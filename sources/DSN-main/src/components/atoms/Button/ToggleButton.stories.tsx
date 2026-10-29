import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bold, Italic, Link2 } from 'lucide-react';
import { ToggleButton } from './ToggleButton';
import spec from './ToggleButton.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof ToggleButton> = {
  title: 'Actions/Button/Toggle Button',
  component: ToggleButton,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    size: 'md',
    variant: 'ghost',
    selected: false,
    icon: <Bold size={16} aria-hidden="true" />,
    'aria-label': 'Bold',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
    },
    selected: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleButton>;

const VARIANTS = ['primary', 'secondary', 'ghost'] as const;
const row = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } as const;
const stack = { display: 'flex', flexDirection: 'column', gap: 16 } as const;

export const Playground: Story = {};

/** Each variant, unselected and selected. `ghost` is the default, for toolbars. */
export const Variants: Story = {
  render: (args) => (
    <div style={stack}>
      {[false, true].map((selected) => (
        <div key={String(selected)} style={row}>
          {VARIANTS.map((v) => <ToggleButton key={v} {...args} variant={v} selected={selected} />)}
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {(['sm', 'md'] as const).map((size) => <ToggleButton key={size} {...args} size={size} selected />)}
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div style={row}>
      <ToggleButton {...args} />
      <ToggleButton {...args} selected icon={<Italic size={16} aria-hidden="true" />} aria-label="Italic" />
      <ToggleButton {...args} disabled icon={<Link2 size={16} aria-hidden="true" />} aria-label="Link" />
    </div>
  ),
};

/** A visible label next to the icon. */
export const WithLabel: Story = {
  args: {
    variant: 'secondary',
    selected: true,
    icon: undefined,
    'aria-label': undefined,
    leadingIcon: <Bold size={16} aria-hidden="true" />,
    label: 'Bold',
    showLabel: true,
  },
};
