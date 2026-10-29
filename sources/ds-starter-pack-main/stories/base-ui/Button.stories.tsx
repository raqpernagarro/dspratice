import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { ButtonDemo } from './demos';
import { buttonSpec } from './components/button/button.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const meta = {
  title: 'Base UI/Components/Button',
  component: ButtonDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'outline'] },
    size: { control: 'select', options: ['lg', 'md', 'sm'] },
    destructive: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showIcons: { control: 'boolean' },
    label: { control: 'text' },
  },
} satisfies Meta<typeof ButtonDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    destructive: false,
    disabled: false,
    showIcons: true,
    label: 'Button',
  },
};

/** Every Figma variant (Type × Size × State × Destructive), states shown statically. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={buttonSpec} render={SPECIMENS['button']} />,
  parameters: { layout: 'padded' },
};

/* ------------------------------------------------------------ behavior tests */

/** Behavior test: a click calls onClick. */
export const ClickCallsOnClick: Story = {
  args: { ...Default.args, onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Button' }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** Behavior test: a disabled button ignores clicks. */
export const DisabledIgnoresClick: Story = {
  args: { ...Default.args, disabled: true, onClick: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Button' });
    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
