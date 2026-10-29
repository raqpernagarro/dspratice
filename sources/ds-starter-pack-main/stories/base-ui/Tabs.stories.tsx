import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { tabsSpec } from './components/tabs/tabs.spec';
import { tabSpec } from './components/tabs/tab.spec';

const meta = {
  title: 'Base UI/Components/Tabs',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Arrow keys move between tabs. */
export const Default: Story = { render: () => <>{SPECIMENS['tabs']({ size: 'md' })}</> };

/** Every size. */
export const Matrix: Story = { render: () => <SpecMatrix spec={tabsSpec} render={SPECIMENS['tabs']} />, parameters: { layout: 'padded' } };

/** Every Tab variant (Size × Selected × State). */
export const TabMatrix: Story = { render: () => <SpecMatrix spec={tabSpec} render={SPECIMENS['tab']} />, parameters: { layout: 'padded' } };

/* ------------------------------------------------------------ behavior tests */

/**
 * Behavior test: ArrowRight moves focus to the next tab; Enter selects it and shows its panel.
 * (Base UI's default: tabs are activated manually, so the arrow alone does not switch the panel.)
 */
export const ArrowKeysSwitchTabs: Story = {
  ...Default,
  play: async ({ canvas }) => {
    // Each step waits until the tabs show the expected state before the next key press. Base UI
    // moves focus a moment after the key, so checking (or pressing on) too early fails at random
    // when the full suite keeps the browser busy.
    const overview = await canvas.findByRole('tab', { name: 'Overview', selected: true });
    const projects = canvas.getByRole('tab', { name: 'Projects' });
    await waitFor(() => expect(overview).toHaveAttribute('tabindex', '0'));
    await userEvent.click(overview);
    await waitFor(() => expect(overview).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(projects).toHaveFocus());
    await expect(projects).toHaveAttribute('aria-selected', 'false');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(projects).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(canvas.getByRole('tabpanel')).toHaveTextContent('Milestones and deadlines.'));
  },
};
