import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './components/badge/Badge';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { badgeSpec } from './components/badge/badge.spec';

const meta = {
  title: 'Base UI/Components/Badge',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** One of each type, as they read in a list. */
export const Default: Story = { render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Badge>Draft</Badge>
      <Badge type="info">Queued</Badge>
      <Badge type="success">Deployed</Badge>
      <Badge type="warning">Degraded</Badge>
      <Badge type="error">Failed</Badge>
    </div>
  ) };

/** Every variant (Type × Size). */
export const Matrix: Story = { render: () => <SpecMatrix spec={badgeSpec} render={SPECIMENS['badge']} />, parameters: { layout: 'padded' } };
