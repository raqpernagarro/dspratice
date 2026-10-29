import React, { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressRing } from './ProgressRing';
import type { ProgressRingSize } from './ProgressRing';
import spec from './ProgressRing.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof ProgressRing> = {
  title: 'Feedback/Progress Ring',
  component: ProgressRing,
  args: { label: 'Loading' },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Omit for indeterminate; provide 0–100 for determinate',
    },
    size:  { control: 'select', options: ['sm', 'lg', 'xl', 'xxl'] },
    label: { control: 'text' },
  },
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof ProgressRing>;

// ─── Indeterminate ────────────────────────────────────────────────────────────

export const Playground: Story = {};

const cell = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 } as const;

/** Each size, indeterminate (top) and determinate at 60 % (bottom). */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {[undefined, 60].map((value) => (
        <div key={String(value)} style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {(['sm', 'lg', 'xl', 'xxl'] as ProgressRingSize[]).map((size) => (
            <div key={size} style={cell}>
              <ProgressRing {...args} size={size} value={value} />
              <span style={{ fontSize: 'var(--font-size-body-sm)', color: 'var(--color-foreground-neutral-secondary)' }}>{size}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Determinate values from 0 to 100 %. Omit `value` for the indeterminate spinner. */
export const Steps: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
      {[0, 10, 25, 33, 50, 66, 75, 90, 100].map((v) => (
        <div key={v} style={cell}>
          <ProgressRing {...args} value={v} label={`${v}%`} />
          <span style={{ fontSize: 'var(--font-size-body-sm)', color: 'var(--color-foreground-neutral-secondary)' }}>{v}%</span>
        </div>
      ))}
    </div>
  ),
};

// ─── Parity with Spinner ──────────────────────────────────────────────────────

export const SpinnerParity: Story = {
  name: 'Size parity with Spinner',
  render: () => {
    const sizes: ProgressRingSize[] = ['sm', 'lg', 'xl', 'xxl'];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '12px 24px', alignItems: 'center', fontFamily: 'sans-serif', fontSize: 12, color: '#565860' }}>
        <span style={{ fontWeight: 600 }}>Size</span>
        <span style={{ fontWeight: 600 }}>Spinner</span>
        <span style={{ fontWeight: 600 }}>ProgressRing</span>
        {sizes.map((size) => (
          <React.Fragment key={size}>
            <span>{size}</span>
            {/* Inline Spinner-equivalent for parity — same arc, same size, no track */}
            <svg width={size === 'sm' ? 16 : size === 'lg' ? 32 : size === 'xl' ? 48 : 64}
                 height={size === 'sm' ? 16 : size === 'lg' ? 32 : size === 'xl' ? 48 : 64}
                 viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#0f766e" strokeWidth="3"
                strokeDasharray="70.7 23.6" strokeLinecap="round" transform="rotate(-90 18 18)" />
            </svg>
            <ProgressRing size={size} label={`Ring ${size}`} />
          </React.Fragment>
        ))}
      </div>
    );
  },
};

// ─── Animated determinate ─────────────────────────────────────────────────────

export const AnimatedDeterminate: Story = {
  name: 'Animated determinate (simulated)',
  render: () => {
    const [progress, setProgress] = useState(0);
    const [running, setRunning]   = useState(false);
    const ref = useRef<ReturnType<typeof setInterval> | null>(null);

    function start() { setProgress(0); setRunning(true); }

    useEffect(() => {
      if (!running) return;
      ref.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) { clearInterval(ref.current!); setRunning(false); return 100; }
          return p + 2;
        });
      }, 50);
      return () => clearInterval(ref.current!);
    }, [running]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, fontFamily: 'sans-serif' }}>
        <ProgressRing size="xl" value={progress} label="Uploading file" />
        <span style={{ fontSize: 13, color: progress === 100 ? '#0f766e' : '#09090b', fontWeight: 500 }}>
          {progress === 100 ? 'Done!' : `${progress}%`}
        </span>
        <button
          type="button" onClick={start} disabled={running}
          style={{ padding: '6px 16px', fontSize: 12, borderRadius: 6, border: '1px solid #d4d4d8',
            cursor: running ? 'not-allowed' : 'pointer', background: running ? '#f4f4f5' : '#fff' }}
        >
          {running ? 'Uploading…' : progress === 100 ? 'Upload again' : 'Start upload'}
        </button>
      </div>
    );
  },
};

// ─── In context: file list ────────────────────────────────────────────────────

export const FileList: Story = {
  name: 'In a file upload list',
  render: () => (
    <div style={{ width: 300, fontFamily: 'sans-serif' }}>
      {[
        { name: 'design-tokens.json', value: 100 },
        { name: 'brand-assets.zip',   value: 68  },
        { name: 'report-Q4.pdf',      value: 22  },
      ].map(({ name, value }) => (
        <div key={name}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
            borderBottom: '1px solid #efefef' }}
        >
          <ProgressRing size="lg" value={value} label={`Uploading ${name}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#09090b',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            <div style={{ fontSize: 11, color: '#6b6b6b', marginTop: 2 }}>{value}%</div>
          </div>
        </div>
      ))}
    </div>
  ),
};
