import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingBar } from './LoadingBar';
import { Button } from '../Button/Button';
import spec from './LoadingBar.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof LoadingBar> = {
  title: 'Feedback/Loading Bar',
  component: LoadingBar,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Omit for indeterminate; provide 0–100 for determinate',
    },
    label: { control: 'text' },
  },
  parameters: {
    // Use padded layout — the bar is fixed-position so it will appear at the
    // top of the Storybook preview iframe regardless of story layout.
    layout: 'padded',
    ...specDocsParameters(spec),
  },
  decorators: [
    (Story) => (
      // Provide a relative container so the fixed bar appears inside the
      // story preview area without affecting the Storybook chrome.
      <div style={{ position: 'relative', height: 120, overflow: 'hidden', borderRadius: 8, border: '1px solid #efefef' }}>
        <Story />
        <div style={{ padding: '20px 16px', fontFamily: 'sans-serif', fontSize: 13, color: '#565860' }}>
          ↑ LoadingBar fixed to top of this preview container
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LoadingBar>;

// ─── Indeterminate ────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: { label: 'Navigating to dashboard' },
};

// ─── Determinate ──────────────────────────────────────────────────────────────

export const Determinate: Story = {
  args: { value: 60, label: 'Processing request' },
};

// ─── Animated determinate ─────────────────────────────────────────────────────

export const AnimatedDeterminate: Story = {
  name: 'Animated determinate (simulated)',
  render: function Render() {
    const [progress, setProgress] = useState(0);
    const [running, setRunning]   = useState(false);
    const ref = useRef<ReturnType<typeof setInterval> | null>(null);

    function start() {
      setProgress(0);
      setRunning(true);
    }

    useEffect(() => {
      if (!running) return;
      ref.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) { clearInterval(ref.current!); setRunning(false); return 100; }
          return p + 1;
        });
      }, 30);
      return () => clearInterval(ref.current!);
    }, [running]);

    return (
      <div style={{ position: 'relative', height: 120, overflow: 'hidden', border: '1px solid var(--color-border-neutral-primary)' }}>
        <LoadingBar value={progress} label="Uploading report" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-xs)', padding: 'var(--space-md)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-body-sm)', color: 'var(--color-foreground-neutral-primary)' }}>
            {running ? `Uploading… ${progress}%` : progress === 100 ? 'Upload complete' : 'Select Start to simulate a file upload'}
          </p>
          <Button variant="secondary" size="sm" onClick={start} disabled={running}>
            {running ? 'Uploading…' : 'Start'}
          </Button>
        </div>
      </div>
    );
  },
};
