import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UploadArea, fileMatchesAccept } from './UploadArea';

function dropFiles(files: File[]) {
  fireEvent.drop(screen.getByRole('button'), { dataTransfer: { files } });
}

describe('UploadArea', () => {
  it('renders label and helper text', () => {
    render(<UploadArea label="Label" helperText="Help text" />);

    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByText('Help text')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Label' })).toBeInTheDocument();
  });

  it('emits selected files from native picker', () => {
    const onFilesSelected = vi.fn();
    render(<UploadArea onFilesSelected={onFilesSelected} />);

    const input = document.querySelector('.dsn-upload-area-native') as HTMLInputElement;
    const file = new File(['content'], 'file.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('filters dropped files against accept and reports rejected files', () => {
    const onFilesSelected = vi.fn();
    const onFilesRejected = vi.fn();
    render(
      <UploadArea
        accept=".pdf,image/*"
        multiple
        onFilesSelected={onFilesSelected}
        onFilesRejected={onFilesRejected}
      />,
    );

    const pdf = new File(['%PDF'], 'Contract.PDF', { type: 'application/pdf' });
    const png = new File(['png'], 'photo.png', { type: 'image/png' });
    const exe = new File(['bin'], 'setup.exe', { type: 'application/x-msdownload' });
    dropFiles([pdf, png, exe]);

    expect(onFilesSelected).toHaveBeenCalledWith([pdf, png]);
    expect(onFilesRejected).toHaveBeenCalledWith([exe]);
  });

  it('does not call onFilesSelected when every dropped file is rejected', () => {
    const onFilesSelected = vi.fn();
    const onFilesRejected = vi.fn();
    render(
      <UploadArea accept="application/pdf" onFilesSelected={onFilesSelected} onFilesRejected={onFilesRejected} />,
    );

    const txt = new File(['text'], 'notes.txt', { type: 'text/plain' });
    dropFiles([txt]);

    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(onFilesRejected).toHaveBeenCalledWith([txt]);
  });

  it('accepts every file when accept is not set', () => {
    const onFilesSelected = vi.fn();
    render(<UploadArea onFilesSelected={onFilesSelected} />);

    const txt = new File(['text'], 'notes.txt', { type: 'text/plain' });
    dropFiles([txt]);

    expect(onFilesSelected).toHaveBeenCalledWith([txt]);
  });

  it('renders no size text by default', () => {
    const { container } = render(<UploadArea />);
    expect(container.querySelector('.dsn-upload-area-size-text')).not.toBeInTheDocument();
  });

  it('renders the size text when provided', () => {
    render(<UploadArea maxSizeText="PDF up to 10 MB" />);
    expect(screen.getByText('PDF up to 10 MB')).toBeInTheDocument();
  });
});

describe('fileMatchesAccept', () => {
  const pdf = new File([''], 'report.pdf', { type: 'application/pdf' });

  it('matches extensions case-insensitively', () => {
    expect(fileMatchesAccept(new File([''], 'REPORT.PDF', { type: '' }), '.pdf')).toBe(true);
  });

  it('matches exact MIME types and wildcards', () => {
    expect(fileMatchesAccept(pdf, 'application/pdf')).toBe(true);
    expect(fileMatchesAccept(pdf, 'application/*')).toBe(true);
    expect(fileMatchesAccept(pdf, 'image/*, .docx')).toBe(false);
  });

  it('accepts everything for an empty accept', () => {
    expect(fileMatchesAccept(pdf, undefined)).toBe(true);
    expect(fileMatchesAccept(pdf, ' ')).toBe(true);
  });
});
