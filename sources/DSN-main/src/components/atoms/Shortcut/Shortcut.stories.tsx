import type { Meta, StoryObj } from '@storybook/react-vite';
import { Shortcut } from './Shortcut';
import spec from './Shortcut.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Shortcut> = {
  title: 'Data Display/Shortcut',
  component: Shortcut,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  argTypes: {
    contentColor: {
      control: 'radio',
      options: ['default', 'inverted'],
      description:
        'Colour treatment. Use `inverted` on filled/dark surfaces (e.g. Primary button).',
      table: { defaultValue: { summary: 'default' } },
    },
    label: {
      control: 'text',
      description: 'The keyboard shortcut string displayed in the badge.',
      table: { defaultValue: { summary: '⌘ ↵' } },
    },
    'aria-label': {
      control: 'text',
      description:
        'Plain-English screen-reader label (required). e.g. "Command Enter".',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Shortcut>;

// ─── Content colour variants ──────────────────────────────────────────────────

/**
 * Default — for light surfaces: secondary buttons, menu cells, help text.
 * Muted grey text with a subtle border.
 */
export const Playground: Story = {
  args: {
    contentColor: 'default',
    label: '⌘ K',
    'aria-label': 'Command K',
  },
};

/**
 * Inverted — for filled/dark surfaces such as a Primary button or dark tooltip.
 * White text at 80 % opacity.
 */
export const Inverted: Story = {
  args: {
    contentColor: 'inverted',
    label: '⌘ K',
    'aria-label': 'Command K',
  },
  globals: {
    theme: 'dark',
  },
};

// ─── Common shortcut combinations ────────────────────────────────────────────

export const CommandEnter: Story = {
  args: {
    contentColor: 'default',
    label: '⌘ ↵',
    'aria-label': 'Command Enter',
  },
};

export const CommandShiftP: Story = {
  args: {
    contentColor: 'default',
    label: '⌘ ⇧ P',
    'aria-label': 'Command Shift P',
  },
};

export const CtrlK: Story = {
  name: 'Ctrl+K (Windows/Linux)',
  args: {
    contentColor: 'default',
    label: 'Ctrl K',
    'aria-label': 'Control K',
  },
};

// ─── Both colour variants side by side ───────────────────────────────────────

/**
 * Both `contentColor` variants shown in their intended contexts.
 */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Default — on a light surface */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span
          style={{
            fontFamily: 'sans-serif',
            fontSize: '12px',
            color: '#737373',
            width: '120px',
          }}
        >
          default
        </span>
        <Shortcut contentColor="default" label="⌘ K" aria-label="Command K" />
      </div>

      {/* Inverted — on a filled primary surface */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'var(--color-background-interactive-primary-default)',
        }}
      >
        <span
          style={{
            fontFamily: 'sans-serif',
            fontSize: '12px',
            color: '#ffffff',
            width: '120px',
          }}
        >
          inverted
        </span>
        <Shortcut contentColor="inverted" label="⌘ K" aria-label="Command K" />
      </div>
    </div>
  ),
};
