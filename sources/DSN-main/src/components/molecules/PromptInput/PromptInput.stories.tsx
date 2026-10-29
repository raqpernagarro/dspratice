import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { PromptInput } from './PromptInput';
import type {
  PromptInputAttachment,
  PromptInputModelOption,
  PromptInputQuickAction,
} from './PromptInput.types';
import spec from './PromptInput.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const DEMO_QUICK_ACTIONS: PromptInputQuickAction[] = [
  { id: 'qa-1', label: 'Quick action' },
  { id: 'qa-2', label: 'Quick action' },
];

const DEMO_ATTACHMENTS: PromptInputAttachment[] = [
  { id: 'file-1', fileName: 'Label', fileSize: '10 Mb', previewVariant: 'file' },
  { id: 'file-2', fileName: 'Label', fileSize: '10 Mb', previewVariant: 'file' },
];

const DEMO_MODEL_OPTIONS: PromptInputModelOption[] = [
  { value: 'fast', label: 'Fast' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'advanced', label: 'Advanced' },
];

const meta: Meta<typeof PromptInput> = {
  title: 'Inputs & Controls/Prompt Input',
  component: PromptInput,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'container' },
  args: {
    placeholder: 'Ask me anything...',
    quickActions: [],
    attachments: [],
  },
};

export default meta;
type Story = StoryObj<typeof PromptInput>;

export const Playground: Story = {};

export const WithQuickActions: Story = {
  args: {
    quickActions: [
      ...DEMO_QUICK_ACTIONS,
      { id: 'qa-3', label: 'Summarize' },
      { id: 'qa-4', label: 'Draft reply' },
    ],
  },
};

export const WithAttachments: Story = {
  args: {
    quickActions: [],
    attachments: DEMO_ATTACHMENTS,
  },
};

export const WithModelSelector: Story = {
  name: 'With model selector',
  args: {
    modelOptions: DEMO_MODEL_OPTIONS,
    defaultModelValue: 'balanced',
  },
};

export const Filled: Story = {
  args: {
    defaultValue: 'Explain the quarterly results in plain language.',
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [model, setModel] = useState('balanced');

    return (
      <PromptInput
        value={value}
        onChange={setValue}
        modelOptions={DEMO_MODEL_OPTIONS}
        modelValue={model}
        onModelChange={setModel}
        quickActions={DEMO_QUICK_ACTIONS}
        attachments={value ? [] : DEMO_ATTACHMENTS}
        onSubmit={() => {
          // eslint-disable-next-line no-alert
          alert(`Submitted: ${value}`);
        }}
      />
    );
  },
};

export const KeyboardInteraction: Story = {
  args: {
    defaultValue: 'Ready to send',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Prompt' });

    await userEvent.click(field);
    await userEvent.keyboard('{Enter}');

    const submit = canvas.getByRole('button', { name: 'Submit prompt' });
    expect(submit).toBeInTheDocument();
  },
};
