import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../../Button';
import { AttachmentChip } from '../AttachmentChip';
import './AttachmentField.css';

export interface AttachmentFieldProps {
  id?: string;
  label?: string;
  showLabel?: boolean;
  helperText?: string;
  showHelpText?: boolean;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  accept?: string;
  uploadButtonLabel?: string;
  value?: File | null;
  defaultValue?: File | null;
  onChange?: (file: File | null) => void;
  className?: string;
  'aria-label'?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${Math.round((bytes / (1024 * 1024 * 1024)) * 10) / 10} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round((bytes / 1024) * 10) / 10} KB`;
  }
  return `${bytes} B`;
}

/**
 * Labelled single-file form field: an upload button replaced by an AttachmentChip once a file is picked.
 *
 * @aiSelectWhen A form needs exactly one file as one field among others
 *
 * @aiAvoid Do not use for several files or drag-and-drop — use UploadArea instead
 * @aiAvoid Do not use to display a record's files — use FileRow or AttachmentCard instead
 *
 * @aiSpatial Spans its parent's width; the button and chip inside size to content.
 *
 * @aiCompose State accepted types and size in helperText; validate in onChange and set error with a specific errorMessage
 */
export function AttachmentField({
  id,
  label = 'Label',
  showLabel = true,
  helperText = 'Help text',
  showHelpText = true,
  error = false,
  errorMessage = 'File exceeds size limit',
  disabled = false,
  loading = false,
  accept,
  uploadButtonLabel = 'Upload file',
  value,
  defaultValue = null,
  onChange,
  className,
  'aria-label': ariaLabel,
}: AttachmentFieldProps) {
  const autoId = useId();
  const inputId = id ?? `dsn-attachment-field-${autoId}`;
  const helperId = `${inputId}-helper`;
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;
  const [internalFile, setInternalFile] = useState<File | null>(defaultValue);
  const selectedFile = isControlled ? value ?? null : internalFile;
  const [previewSrc, setPreviewSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) {
      setPreviewSrc(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const helperContent = error ? errorMessage : helperText;
  const fileSizeLabel = useMemo(
    () => (selectedFile ? formatFileSize(selectedFile.size) : ''),
    [selectedFile],
  );

  function emitFile(file: File | null) {
    if (!isControlled) {
      setInternalFile(file);
    }
    onChange?.(file);
  }

  return (
    <div
      className={['dsn-attachment-field', className].filter(Boolean).join(' ')}
      data-disabled={disabled || undefined}
      data-error={error || undefined}
    >
      {showLabel && <p className="dsn-attachment-field-label">{label}</p>}

      <div className="dsn-attachment-field-control">
        {selectedFile ? (
          <AttachmentChip
            fileName={selectedFile.name}
            fileSize={fileSizeLabel}
            previewVariant={selectedFile.type.startsWith('image/') ? 'image' : 'file'}
            previewSrc={previewSrc}
            loading={loading}
            disabled={disabled}
            action="remove"
            onRemove={
              disabled || loading
                ? undefined
                : () => {
                    emitFile(null);
                    if (inputRef.current) {
                      inputRef.current.value = '';
                    }
                  }
            }
            aria-label={selectedFile.name}
          />
        ) : (
          <Button
            variant="secondary"
            size="md"
            disabled={disabled}
            showLeadingIcon
            leadingIcon={<Upload size={16} aria-hidden="true" />}
            onClick={() => inputRef.current?.click()}
            aria-label={ariaLabel ?? uploadButtonLabel}
          >
            {uploadButtonLabel}
          </Button>
        )}

        <input
          ref={inputRef}
          id={inputId}
          className="dsn-attachment-field-native"
          type="file"
          disabled={disabled}
          accept={accept}
          aria-label={ariaLabel ?? uploadButtonLabel}
          aria-describedby={showHelpText && helperContent ? helperId : undefined}
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            emitFile(nextFile);
          }}
        />
      </div>

      {showHelpText && helperContent && (
        <p id={helperId} className="dsn-attachment-field-helper">
          {helperContent}
        </p>
      )}
    </div>
  );
}

export default AttachmentField;
