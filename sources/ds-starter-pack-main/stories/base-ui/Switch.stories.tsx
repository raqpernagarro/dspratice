import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { Switch } from './components/switch/Switch';
import { switchSpec } from './components/switch/switch.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const meta = {
  title: 'Base UI/Components/Switch',
  component: Switch,
  parameters: { layout: 'centered' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] }, disabled: { control: 'boolean' }, children: { control: 'text', name: 'label' } },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { size: 'md', defaultChecked: true, disabled: false, children: 'Notifications' } };

/** Every Figma variant (Checked × Size × State), states shown statically. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={switchSpec} render={SPECIMENS['switch']} />,
  parameters: { layout: 'padded' },
};

/* ------------------------------------------------------------ behavior tests */

const off = { size: 'md', defaultChecked: false, children: 'Notifications' } as const;

/** Behavior test: a click turns the switch on, another turns it off. */
export const ClickToggles: Story = {
  args: off,
  play: async ({ canvas }) => {
    const control = canvas.getByRole('switch', { name: 'Notifications' });
    await expect(control).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(control);
    await expect(control).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(control);
    await expect(control).toHaveAttribute('aria-checked', 'false');
  },
};

/** Behavior test: Space and Enter toggle the focused switch. */
export const KeyboardToggles: Story = {
  args: off,
  play: async ({ canvas }) => {
    const control = canvas.getByRole('switch', { name: 'Notifications' });
    await userEvent.tab();
    await expect(control).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(control).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Enter}');
    await expect(control).toHaveAttribute('aria-checked', 'false');
  },
};
