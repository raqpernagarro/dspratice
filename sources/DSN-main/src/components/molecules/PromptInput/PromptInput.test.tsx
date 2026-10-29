import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PromptInput } from './PromptInput';

const voiceMock = vi.hoisted(() => ({
  isListening: false,
  isSupported: true,
  interimTranscript: '',
  finalTranscript: '',
  confidence: 0,
  error: null as null,
  start: vi.fn(),
  stop: vi.fn(),
  toggle: vi.fn(),
}));

vi.mock('../../../hooks/useVoiceInput', () => ({
  useVoiceInput: () => voiceMock,
}));

describe('PromptInput', () => {
  beforeEach(() => {
    voiceMock.isListening = false;
    voiceMock.isSupported = true;
    voiceMock.start.mockClear();
    voiceMock.stop.mockClear();
  });

  it('renders placeholder, quick actions, and attachments', () => {
    render(
      <PromptInput
        quickActions={[{ id: '1', label: 'Quick action' }]}
        attachments={[{ id: 'a1', fileName: 'Label', fileSize: '10 Mb' }]}
      />,
    );

    expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quick action' })).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByText('10 Mb')).toBeInTheDocument();
  });

  it('shows mic when empty and send when value is set', () => {
    const { rerender } = render(<PromptInput attachments={[]} quickActions={[]} />);
    expect(screen.getByRole('button', { name: 'Start voice dictation' })).toBeInTheDocument();

    rerender(
      <PromptInput value="Hello" onChange={vi.fn()} attachments={[]} quickActions={[]} />,
    );
    expect(screen.getByRole('button', { name: 'Submit prompt' })).toBeInTheDocument();
  });

  it('calls onAttachmentRemove when remove is clicked', () => {
    const onAttachmentRemove = vi.fn();
    render(
      <PromptInput
        attachments={[{ id: 'a1', fileName: 'Budget.pdf', fileSize: '2 MB' }]}
        onAttachmentRemove={onAttachmentRemove}
        quickActions={[]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove Budget.pdf' }));
    expect(onAttachmentRemove).toHaveBeenCalledWith('a1');
  });

  it('opens model selector and calls onModelChange', async () => {
    const user = userEvent.setup();
    const onModelChange = vi.fn();

    render(
      <PromptInput
        modelOptions={[
          { value: 'fast', label: 'Fast' },
          { value: 'advanced', label: 'Advanced' },
        ]}
        modelValue="fast"
        onModelChange={onModelChange}
        attachments={[]}
        quickActions={[]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Model' }));
    await user.click(screen.getByRole('menuitem', { name: 'Advanced' }));

    expect(onModelChange).toHaveBeenCalledWith('advanced');
  });

  it('hides the model selector when modelOptions is not passed', () => {
    render(<PromptInput attachments={[]} quickActions={[]} />);

    expect(screen.queryByRole('button', { name: 'Model' })).not.toBeInTheDocument();
  });

  it('shows dictation UI when listening', () => {
    voiceMock.isListening = true;

    render(<PromptInput attachments={[]} quickActions={[]} />);

    expect(screen.getByRole('img', { name: 'Listening' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel dictation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop dictation' })).toBeInTheDocument();
  });

  it('starts dictation from mic button', async () => {
    const user = userEvent.setup();
    render(<PromptInput attachments={[]} quickActions={[]} />);

    await user.click(screen.getByRole('button', { name: 'Start voice dictation' }));
    expect(voiceMock.start).toHaveBeenCalled();
  });

  it('cancels dictation on Escape', () => {
    voiceMock.isListening = true;

    render(<PromptInput attachments={[]} quickActions={[]} />);

    const field = screen.getByRole('textbox', { name: 'Prompt' });
    fireEvent.keyDown(field, { key: 'Escape' });

    expect(voiceMock.stop).toHaveBeenCalled();
  });

  it('calls onSubmit when send is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <PromptInput
        value="Hello"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        attachments={[]}
        quickActions={[]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Submit prompt' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('triggers hidden file input on attach', () => {
    const onFilesSelected = vi.fn();
    render(
      <PromptInput
        onFilesSelected={onFilesSelected}
        attachments={[]}
        quickActions={[]}
      />,
    );

    const input = document.querySelector('.dsn-prompt-input-file-input') as HTMLInputElement;
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesSelected).toHaveBeenCalled();
  });
});
