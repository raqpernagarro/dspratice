import React, { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from './ProgressBar';
import spec from './ProgressBar.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof ProgressBar> = {
  title: 'Feedback/Progress Bar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    label: { control: 'text' },
  },
  parameters: { ...specDocsParameters(spec), storyWidth: 'full' },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

// ─── Static snapshots ─────────────────────────────────────────────────────────

export const Playground: Story = {
  args: { value: 0, label: 'File upload' },
  decorators: [Wrap],
};

export const Quarter: Story = {
  name: '25 %',
  args: { value: 25, label: 'File upload' },
  decorators: [Wrap],
};

export const Half: Story = {
  name: '50 %',
  args: { value: 50, label: 'File upload' },
  decorators: [Wrap],
};

export const ThreeQuarters: Story = {
  name: '75 %',
  args: { value: 75, label: 'File upload' },
  decorators: [Wrap],
};

export const Complete: Story = {
  name: '100 % — complete',
  args: { value: 100, label: 'File upload' },
  decorators: [Wrap],
};

// ─── Configurable ─────────────────────────────────────────────────────────────

export const Configurable: Story = {
  args: { value: 60, label: 'Processing data' },
  decorators: [Wrap],
};

// ─── All steps grid ───────────────────────────────────────────────────────────

export const Steps: Story = {
  render: () => (
    <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'sans-serif' }}>
      {[0, 10, 25, 33, 50, 66, 75, 90, 100].map((v) => (
        <Row key={v} label={`${v}%`}>
          <ProgressBar value={v} label={`Progress ${v}%`} />
        </Row>
      ))}
    </div>
  ),
};

// ─── In context: File upload ──────────────────────────────────────────────────

export const FileUpload: Story = {
  name: 'File upload panel',
  render: () => (
    <div
      style={{
        width: 360,
        padding: 20,
        border: '1px solid #efefef',
        borderRadius: 12,
        fontFamily: 'sans-serif',
      }}
    >
      {[
        { name: 'design-system-v3.fig', size: '24.4 MB', value: 100 },
        { name: 'brand-assets.zip',     size: '8.1 MB',  value: 72  },
        { name: 'export-tokens.json',   size: '12 KB',   value: 28  },
      ].map(({ name, size, value }) => (
        <div key={name} style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
              fontSize: 13,
              color: '#09090b',
            }}
          >
            <span style={{ fontWeight: 500 }}>{name}</span>
            <span style={{ color: '#565860' }}>{value}%</span>
          </div>
          <ProgressBar value={value} label={`Uploading ${name}`} />
          <div style={{ marginTop: 4, fontSize: 11, color: '#6b6b6b' }}>{size}</div>
        </div>
      ))}
    </div>
  ),
};

// ─── In context: Onboarding checklist ─────────────────────────────────────────

export const OnboardingChecklist: Story = {
  name: 'Onboarding checklist',
  render: () => {
    const steps = ['Profile complete', 'Email verified', 'First project created', 'Team invited'];
    const done = 3;
    const pct = Math.round((done / steps.length) * 100);
    return (
      <div style={{ width: 320, fontFamily: 'sans-serif' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 13,
            color: '#09090b',
          }}
        >
          <span style={{ fontWeight: 500 }}>Getting started</span>
          <span style={{ color: '#565860' }}>
            {done}/{steps.length} complete
          </span>
        </div>
        <ProgressBar value={pct} label="Onboarding progress" />
        <ul style={{ marginTop: 12, padding: 0, listStyle: 'none', fontSize: 13, color: '#09090b' }}>
          {steps.map((step, i) => (
            <li
              key={step}
              style={{
                padding: '6px 0',
                color: i < done ? '#0f766e' : '#6b6b6b',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <span>{i < done ? '✓' : '○'}</span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    );
  },
};

// ─── Animated (simulated progress) ───────────────────────────────────────────

export const Animated: Story = {
  name: 'Animated (simulated upload)',
  render: () => {
    const [progress, setProgress] = useState(0);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    function start() {
      setProgress(0);
      setRunning(true);
    }

    useEffect(() => {
      if (!running) return;
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            return 100;
          }
          return p + 2;
        });
      }, 60);
      return () => clearInterval(intervalRef.current!);
    }, [running]);

    return (
      <div style={{ width: 320, fontFamily: 'sans-serif' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 13,
            color: '#09090b',
          }}
        >
          <span style={{ fontWeight: 500 }}>Uploading report.pdf</span>
          <span style={{ color: progress === 100 ? '#0f766e' : '#565860' }}>
            {progress === 100 ? 'Done' : `${progress}%`}
          </span>
        </div>
        <ProgressBar value={progress} label="Uploading report.pdf" />
        <button
          type="button"
          onClick={start}
          disabled={running}
          style={{
            marginTop: 12,
            padding: '6px 16px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid #d4d4d8',
            background: running ? '#f4f4f5' : '#fff',
            cursor: running ? 'not-allowed' : 'pointer',
          }}
        >
          {running ? 'Uploading…' : progress === 100 ? 'Upload again' : 'Start upload'}
        </button>
      </div>
    );
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Wrap(Story: () => React.ReactNode) {
  return (
    <div style={{ width: 320 }}>
      <Story />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ minWidth: 40, fontSize: 12, color: '#565860', textAlign: 'right' }}>
        {label}
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
