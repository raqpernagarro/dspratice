import type { Meta, StoryObj } from '@storybook/react-vite';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { avatarSpec } from './components/avatar/avatar.spec';

const meta = {
  title: 'Base UI/Components/Avatar',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A picture, and initials as the fallback. */
export const Default: Story = { render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {SPECIMENS['avatar']({ size: 'lg', type: 'image' })}
      {SPECIMENS['avatar']({ size: 'lg', type: 'initials' })}
    </div>
  ) };

/** Every variant (Size × Type). */
export const Matrix: Story = { render: () => <SpecMatrix spec={avatarSpec} render={SPECIMENS['avatar']} />, parameters: { layout: 'padded' } };
