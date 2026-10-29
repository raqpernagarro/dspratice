import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroupVertical } from './ButtonGroupVertical';
import { Button } from '../Button/Button';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import spec from './ButtonGroupVertical.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof ButtonGroupVertical> = {
  title: 'Actions/Button Group/Button Group Vertical',
  component: ButtonGroupVertical,
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
type Story = StoryObj<typeof ButtonGroupVertical>;

function SecondaryIconButton({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <Button
      variant="secondary"
      size={size}
      showLabel={false}
      showLeadingIcon
      leadingIcon={<PlaceholderIcon />}
      aria-label="Button"
    />
  );
}

/** Buttons inside a group share one size — the group passes it down. */
export const Playground: Story = {
  render: (args) => (
    <ButtonGroupVertical {...args}>
      <SecondaryIconButton size={args.size} />
      <SecondaryIconButton size={args.size} />
      <SecondaryIconButton size={args.size} />
    </ButtonGroupVertical>
  ),
};

/** Glued (shared borders, default) and `spaceBetween` (separate buttons with a gap). */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {[false, true].map((spaceBetween) => (
        <ButtonGroupVertical key={String(spaceBetween)} {...args} spaceBetween={spaceBetween}>
          <SecondaryIconButton size={args.size} />
          <SecondaryIconButton size={args.size} />
          <SecondaryIconButton size={args.size} />
        </ButtonGroupVertical>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {(['sm', 'md'] as const).map((size) => (
        <ButtonGroupVertical key={size} {...args} size={size}>
          <SecondaryIconButton size={size} />
          <SecondaryIconButton size={size} />
        </ButtonGroupVertical>
      ))}
    </div>
  ),
};
