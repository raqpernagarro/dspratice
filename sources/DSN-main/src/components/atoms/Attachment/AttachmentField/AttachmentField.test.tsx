import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentField } from './AttachmentField';

describe('AttachmentField', () => {
  it('renders upload trigger button and hidden file input by default', () => {
    const { container } = render(<AttachmentField label="Label" helperText="Help text" />);

    expect(screen.getByRole('button', { name: 'Upload file' })).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });

  it('emits selected file and renders attachment chip', () => {
    const onChange = vi.fn();
    const { container } = render(<AttachmentField label="Label" helperText="Help text" onChange={onChange} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'file.extension', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith(file);
    expect(screen.getByRole('group', { name: 'file.extension' })).toBeInTheDocument();
  });

  it('shows error helper text when error is true', () => {
    render(
      <AttachmentField
        label="Label"
        value={new File(['content'], 'file.extension', { type: 'application/pdf' })}
        error
        errorMessage="File exceeds 5 MB"
      />,
    );

    expect(screen.getByText('File exceeds 5 MB')).toBeInTheDocument();
  });

  it('uses a correctly spelled default error message', () => {
    render(
      <AttachmentField
        label="Label"
        value={new File(['content'], 'file.extension', { type: 'application/pdf' })}
        error
      />,
    );

    expect(screen.getByText('File exceeds size limit')).toBeInTheDocument();
  });
});
