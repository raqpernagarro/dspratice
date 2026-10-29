import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './components/input/Input';
import { inputSpec } from './components/input/input.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { EnvelopeSimple } from '@phosphor-icons/react';
import { Button } from './components/button/Button';

const meta = {
  title: 'Base UI/Components/Input',
  component: Input,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { size: 'md', placeholder: 'Search', disabled: false, showIcon: true, 'aria-label': 'Search' },
};

/** Same heights as Button, so they line up in a row. */
export const WithButton: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', gap: 8 }}>
          <Input size={size} placeholder="Search" aria-label="Search" />
          <Button size={size}>Search</Button>
        </div>
      ))}
    </div>
  ),
};

/** Without an icon (Show icon = False in Figma). */
export const WithoutIcon: Story = {
  args: { size: 'md', placeholder: 'e.g. Colm Tuite', showIcon: false, 'aria-label': 'Name' },
};

/** Another icon (Icon swap in Figma). */
export const OtherIcon: Story = {
  args: { size: 'md', placeholder: 'you@company.com', icon: <EnvelopeSimple weight="fill" />, 'aria-label': 'Email' },
};

/** Every Figma variant (Size × State × Filled × Invalid), states shown statically. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={inputSpec} render={SPECIMENS['input']} />,
  parameters: { layout: 'padded' },
};
