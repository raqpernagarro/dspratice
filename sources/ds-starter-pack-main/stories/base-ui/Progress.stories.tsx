import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpecMatrix } from './shared/SpecMatrix';
import { progressSpec } from './components/progress/progress.spec';
import { SPECIMENS } from './components/specimens';
import { Progress } from './components/progress/Progress';

function LiveProgress() {
  const [value, setValue] = React.useState(20);
  React.useEffect(() => {
    const id = setInterval(() => setValue((v) => (v >= 100 ? 0 : Math.min(100, v + Math.round(Math.random() * 20)))), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ width: 240 }}>
      <Progress label="Export data" value={value} />
    </div>
  );
}

const meta = {
  title: 'Base UI/Components/Progress',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The value moves on its own here, like an export in progress. */
export const Default: Story = { render: () => <LiveProgress /> };

/** value={null}: the total is unknown. */
export const Indeterminate: Story = { render: () => (
    <div style={{ width: 240 }}>
      <Progress label="Connecting" value={null} showValue={false} />
    </div>
  ) };

/** As in Figma (40%). */
export const Preview: Story = { render: () => <>{SPECIMENS['progress']({})}</> };

/** Every Value step. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={progressSpec} render={SPECIMENS['progress']} />,
  parameters: { layout: 'padded' },
};
