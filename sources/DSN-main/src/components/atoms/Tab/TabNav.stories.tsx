import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import { TabNav } from './TabNav';
import spec from './TabNav.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const sections = [
  { href: '#overview', label: 'Overview', current: true },
  { href: '#activity', label: 'Activity' },
  { href: '#members', label: 'Members' },
  { href: '#settings', label: 'Settings' },
];

const meta: Meta<typeof TabNav> = {
  title: 'Navigation/Tab Nav',
  component: TabNav,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'full' },
  args: {
    items: sections,
    'aria-label': 'Project sections',
  },
};

export default meta;
type Story = StoryObj<typeof TabNav>;

export const Playground: Story = {};

export const WithIcons: Story = {
  args: {
    items: sections.map((s) => ({ ...s, showLeadingIcon: true, leadingIcon: <PlaceholderIcon /> })),
  },
};

/** Every item is a link in the normal Tab order, and the current page is announced via aria-current. */
export const KeyboardNavigation: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: 'Project sections' })).toBeInTheDocument();
    await expect(canvas.queryByRole('tablist')).not.toBeInTheDocument();

    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Overview' })).toHaveFocus();
    await expect(canvas.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');

    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Activity' })).toHaveFocus();
    await expect(canvas.getByRole('link', { name: 'Activity' })).not.toHaveAttribute('aria-current');
  },
};
