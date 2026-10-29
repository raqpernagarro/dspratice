import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { Avatar } from '../Avatar';
import spec from './Badge.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Badge> = {
  title: 'Data Display/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { size: 'sm', variant: 'highlight-soft', count: 1 },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['dot', 'sm'],
    },
    variant: {
      control: 'select',
      options: ['highlight-soft', 'highlight-strong', 'informative', 'inverted', 'critical'],
    },
    count: { control: 'number' },
  },
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof Badge>;

const VARIANTS = ['highlight-soft', 'highlight-strong', 'informative', 'inverted', 'critical'] as const;
const row = { display: 'flex', gap: 12, alignItems: 'center' } as const;

export const Playground: Story = {};

/** Every variant as a count badge (`sm`) and as a dot. */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'dot'] as const).map((size) => (
        <div key={size} style={row}>
          {VARIANTS.map((v) => <Badge key={v} {...args} size={size} variant={v} />)}
        </div>
      ))}
    </div>
  ),
};

/** Counts up to 99 show as-is; anything higher shows "99+". */
export const Counts: Story = {
  render: (args) => (
    <div style={row}>
      {[1, 9, 99, 100].map((count) => <Badge key={count} {...args} count={count} />)}
    </div>
  ),
};

// ─── Composite — Badge overlaid on Avatar ─────────────────────────────────────

export const ExampleOnAvatar: Story = {
  name: 'Example: on avatar',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Count badge top-right of avatar */}
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <Avatar size="sm" variant="profile" fill="initials" initials="JD" name="Jane Doe" />
        <span style={{ position: 'absolute', top: -4, right: -4 }}>
          <Badge size="sm" variant="critical" count={3} aria-label="3 notifications" />
        </span>
      </div>
      {/* Dot badge bottom-right of avatar */}
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <Avatar size="sm" variant="profile" fill="initials" initials="AB" name="Ana Beatriz" />
        <span style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <Badge size="dot" variant="highlight-strong" aria-label="Online" />
        </span>
      </div>
    </div>
  ),
};
