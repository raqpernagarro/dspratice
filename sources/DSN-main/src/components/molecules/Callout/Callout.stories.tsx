import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../atoms/Button';
import { ButtonGroup } from '../../atoms/ButtonGroup';
import { Checkbox } from '../../atoms/Checkbox';
import { Callout } from './Callout';
import spec from './Callout.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Callout> = {
  title: 'Feedback/Callout',
  component: Callout,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'container' },
  args: {
    severity: 'default',
    title: 'Title',
    description: 'Description',
  },
  argTypes: {
    severity: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Callout>;

export const Playground: Story = {};

/** `default` for neutral information; `success`, `warning` and `error` for status. */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['default', 'success', 'warning', 'error'] as const).map((severity) => (
        <Callout key={severity} {...args} severity={severity} title={severity} />
      ))}
    </div>
  ),
};

export const WithSlots: Story = {
  args: {
    severity: 'default',
    title: 'Title',
    description: 'Description',
    content: (
      <div
        style={{
          border: '1px dashed var(--color-border-neutral-secondary)',
          background: 'var(--input-background-default)',
          color: 'var(--color-foreground-neutral-secondary)',
          fontFamily: 'var(--font-family-default)',
          fontSize: 'var(--font-size-body-md)',
          lineHeight: 'var(--font-line-height-body-md)',
          letterSpacing: 'var(--font-letter-spacing-normal)',
          padding: 'var(--space-md)',
          textAlign: 'center',
        }}
      >
        Content slot
      </div>
    ),
    supporting: <Checkbox size="md" label="Label" showTrailingIcon={false} />,
    actions: (
      <ButtonGroup size="md" spaceBetween aria-label="Callout actions">
        <Button variant="ghost" size="md">
          Cancel
        </Button>
        <Button variant="primary" size="md">
          Confirm
        </Button>
      </ButtonGroup>
    ),
  },
};
