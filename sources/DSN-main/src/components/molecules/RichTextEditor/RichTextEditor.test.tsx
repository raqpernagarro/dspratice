import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from './RichTextEditor';

function getEditorElement(container: HTMLElement): HTMLElement {
  const node = container.querySelector('.dsn-rich-text-editor-content');
  if (!(node instanceof HTMLElement)) {
    throw new Error('Editor content element not found');
  }
  return node;
}

describe('RichTextEditor', () => {
  it('renders label, toolbar, and helper metadata', () => {
    const { container } = render(
      <RichTextEditor label="Body" helperText="Use Markdown-like formatting." maxLength={120} />,
    );

    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Rich text formatting toolbar' })).toBeInTheDocument();
    expect(screen.getByText('Use Markdown-like formatting.')).toBeInTheDocument();
    expect(container.querySelector('.dsn-rich-text-editor-count')).toHaveTextContent('0/120');
  });

  it('renders character counter from current content', () => {
    const { container } = render(
      <RichTextEditor
        label="Body"
        maxLength={20}
        defaultValue="<p>Hello</p>"
      />,
    );

    expect(container.querySelector('.dsn-rich-text-editor-count')).toHaveTextContent('5/20');
  });

  it('supports keyboard navigation to toolbar actions', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor label="Body" />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Cycle block style' })).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
  });

  it('prevents interaction when disabled', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RichTextEditor
        label="Body"
        disabled
        value="<p>Locked</p>"
      />,
    );

    const editor = getEditorElement(container);
    expect(editor).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();

    await user.click(editor);
    await user.keyboard('X');
  });

  it('invokes footer and attachment callbacks', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const onFooterCheckedChange = vi.fn();
    const onAttachmentRemove = vi.fn();

    render(
      <RichTextEditor
        label="Body"
        showFooter
        footerLabel="Notify followers"
        attachments={[{ id: '1', fileName: 'Label', fileSize: '10 Mb' }]}
        onAttachmentRemove={onAttachmentRemove}
        onFooterCheckedChange={onFooterCheckedChange}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove Label' }));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onAttachmentRemove).toHaveBeenCalledWith('1');
    expect(onFooterCheckedChange).toHaveBeenCalledWith(true);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('hides the footer by default', () => {
    render(<RichTextEditor label="Body" />);

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
  });

  it('renders the helper icon only when provided', () => {
    const { container, rerender } = render(<RichTextEditor label="Body" helperText="Hint" />);
    expect(container.querySelector('.dsn-rich-text-editor-meta-icon')).toBeNull();

    rerender(
      <RichTextEditor label="Body" helperText="Hint" helperIcon={<svg data-testid="helper-icon" />} />,
    );
    expect(screen.getByTestId('helper-icon')).toBeInTheDocument();
  });

  it('does not render an emoji button', () => {
    render(<RichTextEditor label="Body" onAddAttachment={() => {}} />);

    expect(screen.queryByRole('button', { name: 'Insert emoji' })).not.toBeInTheDocument();
  });

  it('asks for the link URL in a popover instead of window.prompt', async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, 'prompt');
    render(<RichTextEditor label="Body" />);

    await user.click(screen.getByRole('button', { name: 'Insert link' }));

    const dialog = screen.getByRole('dialog', { name: 'Insert link' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Link URL' })).toBeInTheDocument();
    expect(promptSpy).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Insert link' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insert link' })).toHaveFocus();

    promptSpy.mockRestore();
  });

  it('rejects script URLs in the link popover', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor label="Body" />);

    await user.click(screen.getByRole('button', { name: 'Insert link' }));
    await user.type(screen.getByRole('textbox', { name: 'Link URL' }), 'javascript:alert(1)');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByRole('dialog', { name: 'Insert link' })).toBeInTheDocument();
    expect(screen.getByText(/Enter a valid URL/)).toBeInTheDocument();
  });

  it('closes the link popover when a URL is applied', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor label="Body" />);

    await user.click(screen.getByRole('button', { name: 'Insert link' }));
    await user.type(screen.getByRole('textbox', { name: 'Link URL' }), 'example.com{Enter}');

    expect(screen.queryByRole('dialog', { name: 'Insert link' })).not.toBeInTheDocument();
  });

  it('links the selected text with the URL from the popover', async () => {
    const user = userEvent.setup();
    // jsdom has no layout; Lexical measures the selection to scroll it into view.
    const rangeProto = Range.prototype as Partial<Range>;
    const originalRect = rangeProto.getBoundingClientRect;
    rangeProto.getBoundingClientRect = () => new DOMRect();
    const { container } = render(<RichTextEditor label="Body" defaultValue="<p>Hello</p>" />);
    const editor = getEditorElement(container);

    await user.click(editor);
    await act(async () => {
      const textNode = editor.querySelector('span')?.firstChild;
      if (!textNode) throw new Error('Text node not found');
      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 5);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });

    await user.click(screen.getByRole('button', { name: 'Insert link' }));
    await user.type(screen.getByRole('textbox', { name: 'Link URL' }), 'example.com{Enter}');

    await waitFor(() => expect(editor.querySelector('a')).not.toBeNull());
    expect(editor.querySelector('a')).toHaveAttribute('href', 'https://example.com');
    expect(editor.querySelector('a')).toHaveTextContent('Hello');

    rangeProto.getBoundingClientRect = originalRect;
  });
});
