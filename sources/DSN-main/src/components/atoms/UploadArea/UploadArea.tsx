import React, { useId, useRef, useState } from 'react';
import './UploadArea.css';

export interface UploadAreaProps {
  id?: string;
  label?: string;
  helperText?: string;
  helperIcon?: React.ReactNode;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  maxSizeText?: string;
  dragText?: string;
  dropText?: string;
  /** Called with the files that match `accept` (picked or dropped). */
  onFilesSelected?: (files: File[]) => void;
  /** Called with the files that do not match `accept` — show a clear error for them. */
  onFilesRejected?: (files: File[]) => void;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  className?: string;
  'aria-label'?: string;
}

/**
 * Checks a file against an `accept` string (comma-separated MIME types, `type/*` wildcards
 * and `.ext` extensions), matching the native file input's rules.
 */
export function fileMatchesAccept(file: File, accept?: string): boolean {
  const tokens = (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith('.')) {
      return fileName.endsWith(token);
    }
    if (token.endsWith('/*')) {
      return fileType.startsWith(token.slice(0, -1));
    }
    return fileType === token;
  });
}

function UploadCloudIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 16L12 12M12 12L8 16M12 12V20M20.39 18.39C21.3655 17.8573 22.1359 17.0176 22.5789 16.0004C23.0218 14.9833 23.1125 13.8474 22.836 12.7737C22.5595 11.7 21.9317 10.7502 21.051 10.0757C20.1703 9.40118 19.0898 9.0399 17.98 9.05H16.72C16.4176 7.88024 15.854 6.79419 15.0709 5.87368C14.2878 4.95316 13.3058 4.22212 12.1998 3.73454C11.0938 3.24696 9.89114 3.01595 8.68219 3.05892C7.47325 3.10189 6.29018 3.41772 5.22287 3.98282C4.15556 4.54793 3.23226 5.3472 2.52208 6.32053C1.81191 7.29386 1.33398 8.41797 1.12408 9.605C0.914179 10.792 0.977588 12.0116 1.30956 13.1704C1.64154 14.3292 2.23322 15.3974 3.03999 16.29"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Labelled drag-and-drop zone that is also a button opening the file picker; reports chosen or dropped files.
 *
 * @aiSelectWhen Uploading is the main task of a step or panel, or several files may be added at once
 *
 * @aiAvoid Do not use for one file among other form fields — use AttachmentField instead
 * @aiAvoid Do not use for composer attachments — use PromptInput or RichTextEditor attachments instead
 * @aiAvoid Do not use to list uploaded files — use FileRow or AttachmentCard instead
 *
 * @aiSpatial Fills its parent's width; only collects files — show progress below it with FileRow.
 *
 * @aiCompose State accepted types and size limit in maxSizeText; handle onFilesRejected and check size in onFilesSelected
 */
export function UploadArea({
  id,
  label = 'Label',
  helperText = 'Help text',
  helperIcon,
  disabled = false,
  accept,
  multiple = false,
  maxSizeText,
  dragText = 'Drag and drop or press to upload',
  dropText = 'Drop here',
  onFilesSelected,
  onFilesRejected,
  onFocus,
  onBlur,
  className,
  'aria-label': ariaLabel,
}: UploadAreaProps) {
  const autoId = useId();
  const inputId = id ?? `dsn-upload-area-${autoId}`;
  const labelId = `${inputId}-label`;
  const helperId = `${inputId}-helper`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openFileDialog() {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }

  function emitFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }
    const accepted: File[] = [];
    const rejected: File[] = [];
    Array.from(fileList).forEach((file) => {
      (fileMatchesAccept(file, accept) ? accepted : rejected).push(file);
    });

    if (accepted.length > 0) {
      onFilesSelected?.(accepted);
    }
    if (rejected.length > 0) {
      onFilesRejected?.(rejected);
    }
  }

  return (
    <div className={['dsn-upload-area', className].filter(Boolean).join(' ')}>
      {label && <p className="dsn-upload-area-label" id={labelId}>{label}</p>}

      <button
        id={inputId}
        type="button"
        className="dsn-upload-area-zone"
        data-disabled={disabled || undefined}
        data-dragging={isDragging || undefined}
        disabled={disabled}
        aria-label={ariaLabel ?? 'Upload files - click or drag and drop'}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={helperText ? helperId : undefined}
        onClick={openFileDialog}
        onFocus={onFocus}
        onBlur={onBlur}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) {
            emitFiles(event.dataTransfer.files);
          }
        }}
      >
        <span className="dsn-upload-area-icon-wrap" aria-hidden="true">
          <span className="dsn-upload-area-icon">
            <UploadCloudIcon />
          </span>
        </span>

        <span className="dsn-upload-area-label-wrap">
          <span className="dsn-upload-area-main-text">
            {isDragging && !disabled ? dropText : dragText}
          </span>
        </span>

        {!isDragging && maxSizeText && (
          <span className="dsn-upload-area-size-text">{maxSizeText}</span>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        className="dsn-upload-area-native"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => emitFiles(event.target.files)}
      />

      {helperText && (
        <div className="dsn-upload-area-meta">
          {helperIcon && (
            <span className="dsn-upload-area-meta-icon-wrap" aria-hidden="true">
              <span className="dsn-upload-area-meta-icon">{helperIcon}</span>
            </span>
          )}
          <p id={helperId} className="dsn-upload-area-helper">
            {helperText}
          </p>
        </div>
      )}
    </div>
  );
}

export default UploadArea;
