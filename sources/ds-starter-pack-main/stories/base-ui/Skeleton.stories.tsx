import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './components/skeleton/Skeleton';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { skeletonSpec } from './components/skeleton/skeleton.spec';

const meta = {
  title: 'Base UI/Components/Skeleton',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A loading list row: an avatar, two lines of text (the second shorter), and a thumbnail. */
export const Default: Story = { render: () => (
    <div role="status" aria-busy="true" aria-label="Loading contacts" style={{ display: 'flex', gap: 12, alignItems: 'center', width: 360 }}>
      <Skeleton shape="circle" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <Skeleton />
        <Skeleton width="60%" />
      </div>
      <Skeleton shape="block" width={64} height={48} />
    </div>
  ) };

/** Every variant (Shape). */
export const Matrix: Story = { render: () => <SpecMatrix spec={skeletonSpec} render={SPECIMENS['skeleton']} />, parameters: { layout: 'padded' } };
