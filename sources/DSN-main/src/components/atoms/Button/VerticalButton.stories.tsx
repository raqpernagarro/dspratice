import type { Meta, StoryObj } from '@storybook/react-vite';
import { VerticalButton } from './VerticalButton';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import spec from './VerticalButton.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof VerticalButton> = {
  title: 'Actions/Button/Vertical Button',
  component: VerticalButton,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    variant: 'ghost',
    size: 'md',
    icon: <PlaceholderIcon />,
    children: 'Home',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
      description: 'Visual hierarchy variant.',
      table: { defaultValue: { summary: 'ghost' } },
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
      description: '`md` = 32 × 32 px icon circle (default). `sm` = 24 × 24 px.',
      table: { defaultValue: { summary: 'md' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Prevents all interaction.',
      table: { defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description: 'Shows a spinner inside the icon circle. Sets `aria-busy="true"`.',
      table: { defaultValue: { summary: 'false' } },
    },
    badge: {
      control: 'boolean',
      description: 'Shows a notification dot on the top-right of the icon circle.',
      table: { defaultValue: { summary: 'false' } },
    },
    showLabel: {
      control: 'boolean',
      description: 'Shows the text label below the icon circle.',
      table: { defaultValue: { summary: 'true' } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VerticalButton>;

const VARIANTS = ['primary', 'secondary', 'ghost'] as const;
const row = { display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' } as const;

export const Playground: Story = {};

/** Only the icon circle changes between variants; the label area stays the same. */
export const Variants: Story = {
  render: (args) => (
    <div style={row}>
      {VARIANTS.map((v) => <VerticalButton key={v} {...args} variant={v}>{v}</VerticalButton>)}
    </div>
  ),
};

/** `md` is a 32 × 32 px icon circle; `sm` is 24 × 24 px. */
export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {(['sm', 'md'] as const).map((size) => <VerticalButton key={size} {...args} size={size}>{size}</VerticalButton>)}
    </div>
  ),
};

/** Loading shows a spinner and sets `aria-busy`. The badge is a notification dot. Icon-only buttons need an `aria-label`. */
export const States: Story = {
  render: (args) => (
    <div style={row}>
      <VerticalButton {...args}>Default</VerticalButton>
      <VerticalButton {...args} loading>Loading</VerticalButton>
      <VerticalButton {...args} disabled>Disabled</VerticalButton>
      <VerticalButton {...args} badge>Badge</VerticalButton>
      <VerticalButton {...args} showLabel={false} aria-label="Home" />
    </div>
  ),
};

/** Four vertical buttons as a bottom navigation bar. */
export const ExampleBottomNav: Story = {
  name: 'Example: bottom nav bar',
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-2xs)',
        alignItems: 'flex-start',
        padding: 'var(--space-xs) var(--space-sm)',
        background: 'var(--color-background-neutral-secondary)',
        borderRadius: 20,
      }}
    >
      <VerticalButton icon={<PlaceholderIcon />} variant="primary">Home</VerticalButton>
      <VerticalButton icon={<PlaceholderIcon />} badge>Inbox</VerticalButton>
      <VerticalButton icon={<PlaceholderIcon />}>Library</VerticalButton>
      <VerticalButton icon={<PlaceholderIcon />}>Profile</VerticalButton>
    </div>
  ),
};
