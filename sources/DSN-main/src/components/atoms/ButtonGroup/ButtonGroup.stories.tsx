import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup } from './ButtonGroup';
import { Button } from '../Button/Button';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import spec from './ButtonGroup.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof ButtonGroup> = {
  title: 'Actions/Button Group/Button Group',
  component: ButtonGroup,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    size: 'md',
    spaceBetween: false,
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
    },
    spaceBetween: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

function SecondaryButton({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <Button
      variant="secondary"
      size={size}
      showLeadingIcon
      showTrailingIcon
      leadingIcon={<PlaceholderIcon />}
      trailingIcon={<PlaceholderIcon />}
    >
      Button
    </Button>
  );
}

/** Buttons inside a group share one size — the group passes it down. */
export const Playground: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <SecondaryButton size={args.size} />
      <SecondaryButton size={args.size} />
      <SecondaryButton size={args.size} />
    </ButtonGroup>
  ),
};

/** Glued (shared borders, default) and `spaceBetween` (separate buttons with a gap). */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {[false, true].map((spaceBetween) => (
        <ButtonGroup key={String(spaceBetween)} {...args} spaceBetween={spaceBetween}>
          <SecondaryButton size={args.size} />
          <SecondaryButton size={args.size} />
          <SecondaryButton size={args.size} />
        </ButtonGroup>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {(['sm', 'md'] as const).map((size) => (
        <ButtonGroup key={size} {...args} size={size}>
          <SecondaryButton size={size} />
          <SecondaryButton size={size} />
        </ButtonGroup>
      ))}
    </div>
  ),
};
