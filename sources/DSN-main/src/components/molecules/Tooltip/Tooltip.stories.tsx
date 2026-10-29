import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import spec from './Tooltip.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Tooltip> = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    content: 'Tooltip',
    placement: 'top',
    delay: 150,
  },
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'bottom'],
    },
    open: {
      control: false,
      table: { disable: true },
    },
    defaultOpen: {
      control: false,
      table: { disable: true },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Playground: Story = {
  render: (args) => {
    const { open: _open, defaultOpen: _defaultOpen, ...hoverOnlyArgs } = args;
    return (
      <Tooltip {...hoverOnlyArgs}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: '32px',
          padding: '0 12px',
          borderRadius: '16px',
          border: '1px solid var(--color-border-neutral-primary)',
          background: 'var(--color-background-neutral-primary)',
          color: 'var(--color-foreground-neutral-primary)',
          fontFamily: 'var(--font-family-default)',
          fontSize: 'var(--font-size-label)',
          fontWeight: 'var(--font-weight-medium)',
          lineHeight: 'var(--font-line-height-label)',
        }}
      >
        Hover me
      </span>
      </Tooltip>
    );
  },
};

export const BottomPlacement: Story = {
  args: {
    placement: 'bottom',
    content: 'Additional information',
  },
  render: (args) => {
    const { open: _open, defaultOpen: _defaultOpen, ...hoverOnlyArgs } = args;
    return (
      <Tooltip {...hoverOnlyArgs}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: '32px',
          padding: '0 12px',
          borderRadius: '16px',
          border: '1px solid var(--color-border-neutral-primary)',
          background: 'var(--color-background-neutral-primary)',
          color: 'var(--color-foreground-neutral-primary)',
          fontFamily: 'var(--font-family-default)',
          fontSize: 'var(--font-size-label)',
          fontWeight: 'var(--font-weight-medium)',
          lineHeight: 'var(--font-line-height-label)',
        }}
      >
        Trigger
      </span>
      </Tooltip>
    );
  },
};
