import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { Checkbox } from './components/checkbox/Checkbox';
import { checkboxSpec } from './components/checkbox/checkbox.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const meta = {
  title: 'Base UI/Components/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text', name: 'label' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { size: 'md', defaultChecked: true, indeterminate: false, disabled: false, children: 'Enable notifications' },
};

/** Lined up with Button and other controls of the same size. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Checkbox size="sm" defaultChecked>Small</Checkbox>
      <Checkbox size="md" defaultChecked>Medium</Checkbox>
      <Checkbox size="lg" defaultChecked>Large</Checkbox>
    </div>
  ),
};

/** Every Figma variant (Checked × Size × State), states shown statically. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={checkboxSpec} render={SPECIMENS['checkbox']} />,
  parameters: { layout: 'padded' },
};

/* ------------------------------------------------------------ behavior tests */

const unchecked = { size: 'md', defaultChecked: false, children: 'Enable notifications' } as const;

/** Behavior test: clicking the box checks it, clicking again unchecks it. */
export const ClickTogglesChecked: Story = {
  args: unchecked,
  play: async ({ canvas }) => {
    const box = canvas.getByRole('checkbox', { name: 'Enable notifications' });
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(box);
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await expect(box).toHaveAttribute('data-checked');
    await userEvent.click(box);
    await expect(box).toHaveAttribute('aria-checked', 'false');
  },
};

/** Behavior test: Space toggles the focused box. */
export const SpaceTogglesChecked: Story = {
  args: unchecked,
  play: async ({ canvas }) => {
    const box = canvas.getByRole('checkbox', { name: 'Enable notifications' });
    await userEvent.tab();
    await expect(box).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(box).toHaveAttribute('aria-checked', 'true');
  },
};

/** Behavior test: clicking the label text toggles the box too. */
export const LabelClickTogglesChecked: Story = {
  args: unchecked,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('Enable notifications'));
    await expect(canvas.getByRole('checkbox', { name: 'Enable notifications' })).toHaveAttribute('aria-checked', 'true');
  },
};
