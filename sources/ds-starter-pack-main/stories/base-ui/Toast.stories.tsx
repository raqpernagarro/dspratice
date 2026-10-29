import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpecMatrix } from './shared/SpecMatrix';
import { toastSpec } from './components/toast/toast.spec';
import { SPECIMENS } from './components/specimens';
import { Button } from './components/button/Button';
import { Toast, ToastPreview } from './components/toast/Toast';

const MESSAGES = {
  neutral: ['Message sent', 'Your message is on its way.'],
  success: ['Changes saved', 'Your profile is up to date.'],
  warning: ['Storage almost full', 'You have 5% of your space left.'],
  error: ['Upload failed', 'Check your connection and try again.'],
} as const;

function CreateToast() {
  const toasts = Toast.useToastManager();
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(Object.keys(MESSAGES) as (keyof typeof MESSAGES)[]).map((type) => (
        <Button key={type} variant="secondary" onClick={() => toasts.add({ type, title: MESSAGES[type][0], description: MESSAGES[type][1] })}>
          {type[0].toUpperCase() + type.slice(1)}
        </Button>
      ))}
    </div>
  );
}

function ToastExample() {
  return (
    <Toast.Provider>
      <CreateToast />
      <Toast.Viewport />
    </Toast.Provider>
  );
}

const meta = {
  title: 'Base UI/Components/Toast',
  component: ToastExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ToastExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each button adds a toast of that type; hover the stack to expand it. */
export const Default: Story = {};

/** One toast as designed in Figma (static). */
export const Preview: Story = { render: () => <ToastPreview /> };

/** Every Type. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={toastSpec} render={SPECIMENS['toast']} />,
  parameters: { layout: 'padded' },
};
